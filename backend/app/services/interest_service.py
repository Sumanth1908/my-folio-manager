import calendar
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from dateutil.relativedelta import relativedelta
from sqlmodel import Session, func, select

from app.models import Account, Category, Transaction
from app.models.interest import (
    InterestBalanceBasis,
    InterestDayCount,
    InterestDirection,
    InterestExecution,
    InterestExecutionStatus,
    InterestPolicy,
    InterestRatePeriod,
    InterestTreatment,
)
from app.schemas.interest import (
    InterestPolicyCreate,
    InterestPolicyUpdate,
    InterestPreview,
    InterestPreviewRequest,
)
from app.schemas.transaction import TransactionCreate
from app.services.account_types import get_account_type_definition
from app.services.transaction_service import create_transaction_core


MONEY = Decimal("0.01")


def _naive_utc(value: datetime) -> datetime:
    if value.tzinfo:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def get_interest_policy(session: Session, account_id: str) -> Optional[InterestPolicy]:
    return session.exec(
        select(InterestPolicy).where(InterestPolicy.account_id == account_id)
    ).first()


def get_interest_policies_for_accounts(
    session: Session,
    account_ids: list[str],
) -> dict[str, InterestPolicy]:
    if not account_ids:
        return {}
    policies = session.exec(
        select(InterestPolicy).where(InterestPolicy.account_id.in_(account_ids))
    ).all()
    return {policy.account_id: policy for policy in policies}


def _validate_policy_accounts(
    session: Session,
    account: Account,
    treatment: str,
    payout_account_id: Optional[str],
    category_id: Optional[int],
) -> None:
    definition = get_account_type_definition(account.account_type, account.metadata_)
    if not definition.supports_interest:
        raise ValueError(f"Account type '{definition.label}' does not support interest")

    if treatment == InterestTreatment.PAYOUT.value:
        # NULL means "credit the interest-bearing account itself". With
        # FIXED_PRINCIPAL the ledger grows without changing eligible principal.
        if payout_account_id:
            payout_account = session.get(Account, payout_account_id)
            if not payout_account or payout_account.user_id != account.user_id:
                raise ValueError("Interest payout account not found or access denied")
            if payout_account.currency != account.currency:
                raise ValueError("Interest payout account currency must match the source account")

    if category_id:
        category = session.get(Category, category_id)
        if not category or category.user_id != account.user_id:
            raise ValueError("Interest transaction category not found or access denied")


def create_interest_policy(
    session: Session,
    account: Account,
    policy_in: InterestPolicyCreate,
) -> InterestPolicy:
    if get_interest_policy(session, account.account_id):
        raise ValueError("This account already has an interest policy")

    data = policy_in.model_dump(mode="json")
    data["effective_from"] = _naive_utc(policy_in.effective_from)
    data["end_date"] = _naive_utc(policy_in.end_date) if policy_in.end_date else None
    _validate_policy_accounts(
        session,
        account,
        str(data["treatment"]),
        data.get("payout_account_id"),
        data.get("category_id"),
    )
    policy = InterestPolicy(account_id=account.account_id, **data)
    session.add(policy)
    session.flush()
    session.add(InterestRatePeriod(
        policy_id=policy.policy_id,
        annual_rate=policy.annual_rate,
        effective_from=policy.effective_from,
    ))
    account.is_interest_enabled = policy.enabled
    session.add(account)
    return policy


def update_interest_policy(
    session: Session,
    account: Account,
    policy_in: InterestPolicyUpdate,
) -> InterestPolicy:
    policy = get_interest_policy(session, account.account_id)
    if not policy:
        effective_from = policy_in.effective_from or datetime.now(timezone.utc).replace(tzinfo=None)
        create_data = policy_in.model_dump(exclude_unset=True)
        if policy_in.annual_rate is None:
            raise ValueError("Annual rate is required when creating an interest policy")
        create_data.setdefault("effective_from", effective_from)
        return create_interest_policy(session, account, InterestPolicyCreate(**create_data))

    updates = policy_in.model_dump(exclude_unset=True, mode="json")
    rate_effective_from = _naive_utc(policy_in.effective_from) if policy_in.effective_from else datetime.now(timezone.utc).replace(tzinfo=None)
    updates.pop("effective_from", None)
    if "end_date" in updates and policy_in.end_date:
        updates["end_date"] = _naive_utc(policy_in.end_date)

    proposed_treatment = str(updates.get("treatment", policy.treatment))
    proposed_payout = updates.get("payout_account_id", policy.payout_account_id)
    proposed_category = updates.get("category_id", policy.category_id)
    proposed_direction = str(updates.get("direction", policy.direction))
    proposed_frequency = str(updates.get("settlement_frequency", policy.settlement_frequency))
    proposed_end_date = updates.get("end_date", policy.end_date)
    _validate_policy_accounts(
        session,
        account,
        proposed_treatment,
        proposed_payout,
        proposed_category,
    )
    if proposed_treatment == InterestTreatment.PAYOUT.value and proposed_direction != InterestDirection.EARNED.value:
        raise ValueError("Payout treatment is only valid for earned interest")
    if proposed_treatment == InterestTreatment.INTEREST_DUE.value and proposed_direction != InterestDirection.CHARGED.value:
        raise ValueError("Interest-due treatment requires charged interest")
    if proposed_frequency == "ONE_TIME" and not proposed_end_date:
        raise ValueError("One-time interest settlement requires an end date")

    previous_rate = Decimal(str(policy.annual_rate))
    for key, value in updates.items():
        setattr(policy, key, value)
    if "annual_rate" in updates and Decimal(str(updates["annual_rate"])) != previous_rate:
        existing_rate = session.exec(
            select(InterestRatePeriod).where(
                InterestRatePeriod.policy_id == policy.policy_id,
                InterestRatePeriod.effective_from == rate_effective_from,
            )
        ).first()
        if existing_rate:
            existing_rate.annual_rate = Decimal(str(updates["annual_rate"]))
            session.add(existing_rate)
        else:
            session.add(InterestRatePeriod(
                policy_id=policy.policy_id,
                annual_rate=Decimal(str(updates["annual_rate"])),
                effective_from=rate_effective_from,
            ))
    policy.calculation_version += 1
    policy.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    account.is_interest_enabled = policy.enabled
    session.add(policy)
    session.add(account)
    return policy


def _ledger_balance_before(session: Session, account_id: str, boundary: datetime) -> Decimal:
    value = session.exec(
        select(func.sum(Transaction.amount)).where(
            Transaction.account_id == account_id,
            Transaction.transaction_date < boundary,
        )
    ).one()
    return Decimal(str(value or "0.00"))


def calculate_average_ledger_balance(
    session: Session,
    account: Account,
    start: datetime,
    end: datetime,
) -> Decimal:
    """Average end-of-day ledger balance over [start, end)."""
    start = _naive_utc(start)
    end = _naive_utc(end)
    days = (end.date() - start.date()).days
    if days <= 0:
        return _ledger_balance_before(session, account.account_id, end)

    transactions = session.exec(
        select(Transaction)
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_date >= start,
            Transaction.transaction_date < end,
        )
        .order_by(Transaction.transaction_date, Transaction.transaction_id)
    ).all()

    balance = _ledger_balance_before(session, account.account_id, start)
    total = Decimal("0.00")
    pointer = 0
    current = start
    for _ in range(days):
        boundary = current + relativedelta(days=1)
        while pointer < len(transactions) and transactions[pointer].transaction_date < boundary:
            balance += transactions[pointer].amount
            pointer += 1
        total += balance
        current = boundary
    return total / Decimal(days)


def eligible_balance_for_period(
    session: Session,
    account: Account,
    policy: InterestPolicy,
    start: datetime,
    end: datetime,
) -> Decimal:
    metadata = account.metadata_ or {}
    if policy.balance_basis == InterestBalanceBasis.FIXED_PRINCIPAL.value:
        return Decimal(str(metadata.get("principal_amount", metadata.get("loan_amount", "0.00"))))
    if policy.balance_basis == InterestBalanceBasis.PRINCIPAL_OUTSTANDING.value:
        return Decimal(str(metadata.get("principal_balance", metadata.get("loan_amount", "0.00"))))
    return calculate_average_ledger_balance(session, account, start, end)


def _day_count_denominator(day_count: str, start: datetime, end: datetime) -> Decimal:
    if day_count == InterestDayCount.THIRTY_360.value:
        return Decimal(360)
    if day_count == InterestDayCount.ACTUAL_ACTUAL.value:
        includes_leap_day = any(
            calendar.isleap(year)
            and start.date() <= datetime(year, 2, 29).date() < end.date()
            for year in range(start.year, end.year + 1)
        )
        return Decimal(366 if includes_leap_day else 365)
    return Decimal(365)


def _year_fraction(day_count: str, start: datetime, end: datetime) -> Decimal:
    if day_count == InterestDayCount.THIRTY_360.value:
        convention_days = (
            (end.year - start.year) * 360
            + (end.month - start.month) * 30
            + (min(end.day, 30) - min(start.day, 30))
        )
        return Decimal(convention_days) / Decimal(360)

    if day_count == InterestDayCount.ACTUAL_ACTUAL.value:
        cursor = start
        fraction = Decimal("0")
        while cursor < end:
            next_year = datetime(cursor.year + 1, 1, 1)
            segment_end = min(end, next_year)
            segment_days = (segment_end.date() - cursor.date()).days
            denominator = Decimal(366 if calendar.isleap(cursor.year) else 365)
            fraction += Decimal(segment_days) / denominator
            cursor = segment_end
        return fraction

    return Decimal((end.date() - start.date()).days) / Decimal(365)


def calculate_interest_amount(
    balance: Decimal,
    annual_rate: Decimal,
    day_count: str,
    start: datetime,
    end: datetime,
) -> tuple[int, Decimal]:
    days = max(0, (end.date() - start.date()).days)
    if not days or not balance or not annual_rate:
        return days, Decimal("0.00")
    amount = balance * (annual_rate / Decimal(100)) * _year_fraction(day_count, start, end)
    return days, amount.quantize(MONEY, rounding=ROUND_HALF_UP)


def calculate_policy_period(
    session: Session,
    account: Account,
    policy: InterestPolicy,
    start: datetime,
    end: datetime,
) -> tuple[int, Decimal, Decimal]:
    """Calculate a period across all effective-dated rate segments."""
    start = _naive_utc(start)
    end = _naive_utc(end)
    total_days = max(0, (end.date() - start.date()).days)
    if total_days == 0:
        return 0, Decimal("0.00"), Decimal("0.00")

    rate_periods = session.exec(
        select(InterestRatePeriod)
        .where(
            InterestRatePeriod.policy_id == policy.policy_id,
            InterestRatePeriod.effective_from < end,
        )
        .order_by(InterestRatePeriod.effective_from)
    ).all()
    active_rate = Decimal(str(policy.annual_rate))
    for rate_period in rate_periods:
        if rate_period.effective_from <= start:
            active_rate = Decimal(str(rate_period.annual_rate))

    changes = [period for period in rate_periods if start < period.effective_from < end]
    boundaries = [start, *[period.effective_from for period in changes], end]
    total_interest = Decimal("0.00")
    weighted_balance_days = Decimal("0.00")

    for index in range(len(boundaries) - 1):
        segment_start = boundaries[index]
        segment_end = boundaries[index + 1]
        if index > 0:
            active_rate = Decimal(str(changes[index - 1].annual_rate))
        balance = eligible_balance_for_period(session, account, policy, segment_start, segment_end)
        days, amount = calculate_interest_amount(
            balance,
            active_rate,
            policy.day_count,
            segment_start,
            segment_end,
        )
        weighted_balance_days += balance * Decimal(days)
        total_interest += amount

    average_balance = weighted_balance_days / Decimal(total_days)
    return total_days, average_balance, total_interest.quantize(MONEY, rounding=ROUND_HALF_UP)


def rate_at_period_end(
    session: Session,
    policy: InterestPolicy,
    period_end: datetime,
) -> Decimal:
    rate_period = session.exec(
        select(InterestRatePeriod)
        .where(
            InterestRatePeriod.policy_id == policy.policy_id,
            InterestRatePeriod.effective_from < _naive_utc(period_end),
        )
        .order_by(InterestRatePeriod.effective_from.desc())
    ).first()
    return Decimal(str(rate_period.annual_rate if rate_period else policy.annual_rate))


def settle_interest_period(
    session: Session,
    rule_id: int,
    account: Account,
    policy: InterestPolicy,
    period_start: datetime,
    period_end: datetime,
) -> InterestExecution:
    period_start = _naive_utc(period_start)
    period_end = _naive_utc(period_end)
    existing = session.exec(
        select(InterestExecution).where(
            InterestExecution.policy_id == policy.policy_id,
            InterestExecution.period_start == period_start,
            InterestExecution.period_end == period_end,
        )
    ).first()
    if existing:
        return existing

    days, balance, amount = calculate_policy_period(
        session, account, policy, period_start, period_end
    )

    applied_rate = rate_at_period_end(session, policy, period_end)
    execution = InterestExecution(
        policy_id=policy.policy_id,
        rule_id=rule_id,
        period_start=period_start,
        period_end=period_end,
        eligible_balance=balance.quantize(MONEY, rounding=ROUND_HALF_UP),
        annual_rate=applied_rate,
        days=days,
        accrued_amount=amount,
        treatment=policy.treatment,
        status=(
            InterestExecutionStatus.SKIPPED.value
            if amount == 0
            else InterestExecutionStatus.SUCCESS.value
        ),
    )

    if amount != 0:
        target_account_id = account.account_id
        transaction_amount = amount
        transaction_kind = "INTEREST_CAPITALIZATION"
        description = f"Interest capitalization - {account.account_name}"

        if policy.treatment == InterestTreatment.PAYOUT.value:
            target_account_id = policy.payout_account_id or account.account_id
            transaction_kind = "INTEREST_PAYOUT"
            description = f"Interest payout from {account.account_name}"
        elif policy.direction == InterestDirection.CHARGED.value:
            transaction_amount = -abs(amount)
            transaction_kind = "INTEREST_CHARGE"
            description = f"Interest charged - {account.account_name}"

        transaction = create_transaction_core(
            session,
            TransactionCreate(
                account_id=target_account_id,
                amount=transaction_amount,
                description=description,
                additional_info=(
                    f"Managed interest period {period_start.date()} to {period_end.date()} | "
                    f"Closing rate: {applied_rate}% | Basis: {policy.balance_basis}"
                ),
                category_id=policy.category_id,
                transaction_date=period_end,
            ),
            account.user_id,
            commit=False,
            transaction_kind=transaction_kind,
        )
        execution.transaction_id = transaction.transaction_id

    session.add(execution)
    session.flush()
    return execution


def get_interest_executions(
    session: Session,
    account_id: str,
    user_id: str,
    limit: int = 50,
) -> Optional[list[InterestExecution]]:
    account = session.get(Account, account_id)
    if not account or account.user_id != user_id:
        return None
    policy = get_interest_policy(session, account_id)
    if not policy:
        return []
    return list(
        session.exec(
            select(InterestExecution)
            .where(InterestExecution.policy_id == policy.policy_id)
            .order_by(InterestExecution.period_end.desc())
            .limit(limit)
        ).all()
    )


def preview_interest(request: InterestPreviewRequest) -> InterestPreview:
    policy = request.policy
    metadata = request.metadata_
    start = _naive_utc(policy.effective_from)
    end = _naive_utc(policy.end_date) if policy.end_date else start + relativedelta(months=1)

    if policy.balance_basis == InterestBalanceBasis.PRINCIPAL_OUTSTANDING:
        balance = Decimal(str(metadata.get("principal_balance", metadata.get("loan_amount", 0))))
    elif policy.balance_basis == InterestBalanceBasis.FIXED_PRINCIPAL:
        balance = Decimal(str(metadata.get("principal_amount", metadata.get("loan_amount", 0))))
    else:
        balance = Decimal(str(
            metadata.get("opening_balance")
            or metadata.get("principal_amount")
            or metadata.get("loan_amount")
            or metadata.get("deposit_amount")
            or 0
        ))

    days = max(0, (end.date() - start.date()).days)
    accrued = Decimal("0.00")
    total_interest = Decimal("0.00")
    current = start
    frequency = policy.settlement_frequency.value

    def next_settlement(from_date: datetime) -> datetime:
        if frequency == "MONTHLY":
            return from_date + relativedelta(months=1)
        if frequency == "QUARTERLY":
            quarter_month = ((from_date.month - 1) // 3) * 3 + 4
            if quarter_month > 12:
                return from_date.replace(year=from_date.year + 1, month=1, day=1)
            return from_date.replace(month=quarter_month, day=1)
        if frequency == "YEARLY":
            return from_date + relativedelta(years=1)
        return end

    settlement_at = min(next_settlement(start), end)
    deposit_amount = Decimal(str(metadata.get("deposit_amount", 0)))
    deposit_day = start.day
    is_rd = request.account_type == "RECURRING_DEPOSIT"
    if is_rd:
        # RD principal arrives through scheduled installments; treating the
        # installment amount as an opening balance counted the first deposit
        # twice in previews.
        balance = Decimal("0.00")

    while current < end:
        installment_day = min(deposit_day, calendar.monthrange(current.year, current.month)[1])
        if is_rd and (current == start or current.day == installment_day):
            balance += deposit_amount

        day_end = min(current + relativedelta(days=1), end)
        denominator = _day_count_denominator(policy.day_count.value, current, day_end)
        accrued += balance * (policy.annual_rate / Decimal(100)) / denominator

        if day_end >= settlement_at:
            settled = accrued.quantize(MONEY, rounding=ROUND_HALF_UP)
            total_interest += settled
            if policy.treatment == InterestTreatment.CAPITALIZE:
                balance += settled
            accrued = Decimal("0.00")
            settlement_at = min(next_settlement(settlement_at), end)
        current = day_end

    amount = total_interest.quantize(MONEY, rounding=ROUND_HALF_UP)
    maturity = None
    if policy.end_date:
        maturity = balance.quantize(MONEY, rounding=ROUND_HALF_UP)

    return InterestPreview(
        period_start=start,
        period_end=end,
        days=days,
        eligible_balance=(
            Decimal(str(metadata.get("principal_amount", 0)))
            if request.account_type == "FIXED_DEPOSIT"
            else Decimal(str(metadata.get("loan_amount", metadata.get("deposit_amount", balance))))
        ),
        estimated_interest=amount,
        projected_maturity_amount=maturity,
    )
