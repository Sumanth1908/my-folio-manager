import logging
from typing import Optional
from datetime import date, datetime, timezone, time
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from sqlmodel import Session, select, func

from app.models.account import Account, AccountType
from app.models.rule import Rule, RuleType
from app.models.rule_execution import RuleExecution, RuleExecutionStatus
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransferRequest
from app.schemas.rule import (
    InterestRuleReplayResult,
    InterestRuleScheduleRead,
    InterestRuleScheduleUpdate,
    RuleCreate,
    RulePreview,
    RuleRead,
    RuleUpdate,
    validate_rule_configuration,
)
from app.services.transaction_service import (create_transaction_core,
                                              create_transfer_core)
from app.services.rule_strategy import RuleProcessorFactory, SCHEDULABLE_RULE_TYPES
from app.models.interest import InterestExecution, InterestPolicy

logger = logging.getLogger(__name__)

INTEREST_EXECUTION_ORDER = 900
LOAN_PAYMENT_EXECUTION_ORDER = 950
INTEREST_SETTLEMENT_TIME = time(23, 55)


def make_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def interest_settlement_at(value: datetime | date) -> datetime:
    """Return the contractual day at 23:55 UTC as a naive DB timestamp."""
    settlement_day = value.date() if isinstance(value, datetime) else value
    return datetime.combine(settlement_day, INTEREST_SETTLEMENT_TIME)

def calculate_average_daily_balance(session: Session, account: Account, start_date: datetime, end_date: datetime) -> Decimal:
    start_date = make_aware(start_date)
    end_date = make_aware(end_date)

    base_balance = Decimal("0.00")
    if account.account_type == AccountType.LOAN and account.metadata_:
        base_balance = Decimal(str(account.metadata_.get("loan_amount", "0.00")))

    # Pre-balance logic (transactions before start_date)
    pre_sum = session.exec(
        select(func.sum(Transaction.amount))
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_date < start_date.replace(tzinfo=None)
        )
    ).one() or Decimal("0.00")

    if account.account_type == AccountType.LOAN:
        current_balance = base_balance - pre_sum
    else:
        current_balance = pre_sum

    transactions = session.exec(
        select(Transaction)
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_date >= start_date.replace(tzinfo=None),
            Transaction.transaction_date <= end_date.replace(tzinfo=None)
        )
        .order_by(Transaction.transaction_date.asc())
    ).all()

    total_days = (end_date - start_date).days
    if total_days <= 0:
        return current_balance

    daily_balances_sum = Decimal("0.00")
    tx_ptr = 0
    num_tx = len(transactions)

    current_day = start_date
    for _ in range(total_days):
        day_boundary = current_day + relativedelta(days=1)

        while tx_ptr < num_tx and make_aware(transactions[tx_ptr].transaction_date) < day_boundary:
            tx = transactions[tx_ptr]
            if account.account_type == AccountType.LOAN:
                current_balance -= tx.amount
            else:
                current_balance += tx.amount
            tx_ptr += 1

        daily_balances_sum += current_balance
        current_day = day_boundary

    return daily_balances_sum / Decimal(str(total_days))


def prepare_rule_posting(session: Session, rule: Rule, account: Account) -> dict:
    """Compute what a rule would post right now, without posting anything.

    Shared by real execution and the dry-run preview endpoint.
    """
    now_utc = datetime.now(timezone.utc)
    due_at = make_aware(rule.next_run_at) or now_utc

    config = rule.configuration or {}
    frequency = config.get("frequency")

    if frequency == "DAILY":
        period_start = due_at - relativedelta(days=1)
    elif frequency == "WEEKLY":
        period_start = due_at - relativedelta(weeks=1)
    elif frequency == "MONTHLY":
        period_start = due_at - relativedelta(months=1)
    elif frequency == "QUARTERLY":
        period_start = due_at - relativedelta(months=3)
    elif frequency == "YEARLY":
        period_start = due_at - relativedelta(years=1)
    else:
        period_start = due_at - relativedelta(days=1)

    period_end = due_at
    delta = period_end - period_start
    days_to_post = max(1, delta.days)

    description = f"Auto: {rule.name}"

    info_parts = []
    formula = config.get("formula")
    if rule.rule_type == RuleType.CALCULATION and formula:
        info_parts.append(f"Formula: {formula}")

    if days_to_post > 0:
        start_str = period_start.strftime('%Y-%m-%d')
        end_str = period_end.strftime('%Y-%m-%d')
        info_parts.append(f"Period: {start_str} to {end_str} ({days_to_post} days)")

    additional_info = " | ".join(info_parts) if info_parts else None
    transaction_date = make_aware(rule.next_run_at) or now_utc

    strategy = RuleProcessorFactory.get_strategy(rule.rule_type)
    avg_balance = calculate_average_daily_balance(session, account, period_start, period_end) if rule.rule_type == RuleType.CALCULATION else Decimal("0.00")
    transaction_amount = strategy.evaluate(session, rule, account, avg_balance, days_to_post)

    target_account_id = config.get("target_account_id")
    source_account_id = config.get("source_account_id")
    is_debit = config.get("is_debit", False) or config.get("transaction_type") == "DEBIT"

    return {
        "amount": transaction_amount,
        "is_debit": is_debit,
        "description": description,
        "additional_info": additional_info,
        "transaction_date": transaction_date,
        "period_start": period_start,
        "period_end": period_end,
        "days": days_to_post,
        "frequency": frequency,
        "category_id": config.get("category_id"),
        "target_account_id": target_account_id,
        "source_account_id": source_account_id,
    }


def compute_next_run(
    rule: Rule,
    now_utc: datetime,
) -> tuple[Optional[datetime], bool]:
    """Advance one cadence from the scheduled execution being processed."""
    config = rule.configuration or {}
    frequency = config.get("frequency")
    if frequency == "ONE_TIME" or not frequency:
        return None, False

    if frequency not in {"DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"}:
        # Unknown frequency: configuration validation should make this
        # unreachable; deactivate rather than refire every scheduler tick.
        logger.error(f"Rule {rule.rule_id} has unknown frequency '{frequency}'; deactivating")
        return None, False

    current_run = make_aware(rule.next_run_at) or make_aware(now_utc)
    next_run = advance_run_date(frequency, current_run)

    end_date = config.get("end_date")
    if end_date and next_run:
        end_dt = make_aware(datetime.fromisoformat(end_date))
        if make_aware(next_run) >= end_dt:
            return None, False

    return next_run, True


def advance_run_date(
    frequency: str,
    from_date: datetime,
) -> datetime:
    """Add exactly one configured cadence without calendar-boundary overrides."""
    if frequency == "DAILY":
        return from_date + relativedelta(days=1)
    if frequency == "WEEKLY":
        return from_date + relativedelta(weeks=1)
    if frequency == "MONTHLY":
        return from_date + relativedelta(months=1)
    if frequency == "QUARTERLY":
        return from_date + relativedelta(months=3)
    if frequency == "YEARLY":
        return from_date + relativedelta(years=1)
    raise ValueError(f"Unknown frequency: {frequency}")


def process_interest_rule(
    session: Session,
    rule: Rule,
    account: Account,
) -> None:
    """Settle every due interest period sequentially and atomically."""
    from app.services import interest_service

    config = rule.configuration or {}
    policy_id = config.get("interest_policy_id")
    policy = session.get(InterestPolicy, policy_id) if policy_id else None
    if not policy or policy.account_id != account.account_id:
        raise ValueError("Managed interest rule has no valid interest policy")

    if not policy.enabled:
        rule.is_active = False
        rule.next_run_at = None
        session.add(rule)
        session.add(RuleExecution(
            rule_id=rule.rule_id,
            status=RuleExecutionStatus.SKIPPED,
            error="Interest policy is disabled; rule deactivated",
        ))
        session.commit()
        return

    frequency = config.get("frequency")
    if frequency not in {"DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"}:
        raise ValueError(f"Unknown managed interest frequency: {frequency}")

    now_utc = datetime.now(timezone.utc)
    due_at = make_aware(rule.next_run_at) or now_utc
    last_execution = session.exec(
        select(InterestExecution)
        .where(InterestExecution.policy_id == policy.policy_id)
        .order_by(InterestExecution.period_end.desc())
    ).first()
    period_start = make_aware(last_execution.period_end) if last_execution else make_aware(policy.effective_from)
    end_date = make_aware(policy.end_date)
    processed = 0

    # Catch-up must settle sequentially because each capitalization changes the
    # eligible balance for the following period.
    while due_at and processed < 240:
        period_end = min(due_at, end_date) if end_date else due_at
        if period_end > period_start:
            interest_execution = interest_service.settle_interest_period(
                session,
                rule.rule_id,
                account,
                policy,
                period_start,
                period_end,
            )
            session.add(RuleExecution(
                rule_id=rule.rule_id,
                status=(
                    RuleExecutionStatus.SKIPPED
                    if interest_execution.status == "SKIPPED"
                    else RuleExecutionStatus.SUCCESS
                ),
                amount=(
                    -interest_execution.accrued_amount
                    if policy.direction == "CHARGED"
                    else interest_execution.accrued_amount
                ),
                transaction_id=interest_execution.transaction_id,
                period_start=period_start.replace(tzinfo=None),
                period_end=period_end.replace(tzinfo=None),
                error="Computed amount was zero; nothing posted" if interest_execution.accrued_amount == 0 else None,
            ))
            processed += 1
            period_start = period_end

        if frequency == "ONE_TIME" or (end_date and period_end >= end_date):
            due_at = None
            break

        due_at = make_aware(advance_run_date(frequency, due_at))
        if due_at > now_utc:
            break

    if processed >= 240 and due_at and due_at <= now_utc:
        raise ValueError("Managed interest catch-up exceeded 240 periods")

    rule.next_run_at = due_at.replace(tzinfo=None) if due_at else None
    rule.is_active = due_at is not None
    session.add(rule)
    session.commit()
    session.refresh(rule)


def process_single_rule(session: Session, rule: Rule):
    """Execute a due rule atomically.

    The posted transaction(s), the advanced next_run_at, and the execution
    record are committed together — a crash at any point leaves either a fully
    processed rule or an untouched one, never a double-post.
    """
    account = session.get(Account, rule.account_id)
    if not account:
        logger.error(f"Account {rule.account_id} not found for rule {rule.rule_id}")
        return
    user_id = account.user_id

    if account.status == "Closed":
        logger.info(f"Rule {rule.rule_id} targets closed account {account.account_id}; deactivating")
        rule.is_active = False
        rule.next_run_at = None
        session.add(rule)
        session.add(RuleExecution(
            rule_id=rule.rule_id,
            status=RuleExecutionStatus.SKIPPED,
            error="Account is closed; rule deactivated",
        ))
        session.commit()
        return

    if rule.rule_type == RuleType.INTEREST:
        process_interest_rule(session, rule, account)
        return

    now_utc = datetime.now(timezone.utc)
    posting = prepare_rule_posting(session, rule, account)

    execution = RuleExecution(
        rule_id=rule.rule_id,
        status=RuleExecutionStatus.SUCCESS,
        period_start=posting["period_start"].replace(tzinfo=None),
        period_end=posting["period_end"].replace(tzinfo=None),
    )

    if posting["amount"] == 0:
        # Nothing to post (e.g. zero balance) — advance the schedule anyway so
        # the rule doesn't refire every tick.
        execution.status = RuleExecutionStatus.SKIPPED
        execution.amount = Decimal("0.00")
        execution.error = "Computed amount was zero; nothing posted"
        next_run, is_active = compute_next_run(rule, now_utc)
        rule.next_run_at = next_run.replace(tzinfo=None) if next_run and next_run.tzinfo else next_run
        rule.is_active = is_active
        session.add(rule)
        session.add(execution)
        session.commit()
        session.refresh(rule)
        return

    if posting["target_account_id"] or posting["source_account_id"]:
        from_acc = posting["source_account_id"] or rule.account_id
        to_acc = posting["target_account_id"] or rule.account_id

        transfer_request = TransferRequest(
            from_account_id=from_acc,
            to_account_id=to_acc,
            amount=posting["amount"],
            description=posting["description"],
            additional_info=posting["additional_info"],
            category_id=posting["category_id"],
            transaction_date=posting["transaction_date"]
        )
        result = create_transfer_core(session, transfer_request, user_id, commit=False)
        execution.transfer_id = result.get("transfer_id")
        execution.amount = posting["amount"]
    else:
        transaction_amount = abs(posting["amount"])
        if posting["is_debit"]:
            transaction_amount = -transaction_amount

        tx_create = TransactionCreate(
            account_id=rule.account_id,
            amount=transaction_amount,
            description=posting["description"],
            additional_info=posting["additional_info"],
            category_id=posting["category_id"],
            transaction_date=posting["transaction_date"]
        )
        transaction = create_transaction_core(session, tx_create, user_id, commit=False)
        execution.transaction_id = transaction.transaction_id
        execution.amount = transaction_amount

    next_run, is_active = compute_next_run(rule, now_utc)
    rule.next_run_at = next_run.replace(tzinfo=None) if next_run and next_run.tzinfo else next_run
    rule.is_active = is_active

    session.add(rule)
    session.add(execution)
    session.commit()
    session.refresh(rule)


def record_rule_failure(engine, rule_id: int, error: str):
    """Persist a FAILED execution in its own session (the run's session rolled back)."""
    try:
        with Session(engine) as session:
            session.add(RuleExecution(
                rule_id=rule_id,
                status=RuleExecutionStatus.FAILED,
                error=error[:500],
            ))
            session.commit()
    except Exception as e:
        logger.error(f"Could not record failure for rule {rule_id}: {e}")


def get_rule_executions(session: Session, rule_id: int, user_id: str, limit: int = 50):
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        return None
    return session.exec(
        select(RuleExecution)
        .where(RuleExecution.rule_id == rule_id)
        .order_by(RuleExecution.ran_at.desc())
        .limit(limit)
    ).all()


def preview_rule(session: Session, rule_id: int, user_id: str) -> RulePreview:
    """Dry-run: compute what the rule would post, without posting."""
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        raise ValueError("Rule not found")
    if rule.rule_type not in SCHEDULABLE_RULE_TYPES:
        raise ValueError("Only transaction or calculation rules can be previewed.")

    account = session.get(Account, rule.account_id)
    if not account:
        raise ValueError("Account not found")

    if rule.rule_type == RuleType.INTEREST:
        from app.services import interest_service

        config = rule.configuration or {}
        policy = session.get(InterestPolicy, config.get("interest_policy_id"))
        if not policy or policy.account_id != account.account_id:
            raise ValueError("Managed interest rule has no valid interest policy")
        now_utc = datetime.now(timezone.utc)
        due_at = min(make_aware(rule.next_run_at) or now_utc, now_utc)
        last_execution = session.exec(
            select(InterestExecution)
            .where(InterestExecution.policy_id == policy.policy_id)
            .order_by(InterestExecution.period_end.desc())
        ).first()
        period_start = make_aware(last_execution.period_end) if last_execution else make_aware(policy.effective_from)
        days, _balance, amount = interest_service.calculate_policy_period(
            session, account, policy, period_start, due_at
        )
        return RulePreview(
            rule_id=rule.rule_id,
            amount=abs(amount),
            is_debit=policy.direction == "CHARGED",
            description=f"Managed interest - {account.account_name}",
            period_start=period_start,
            period_end=due_at,
            days=days,
            from_account_id=None,
            to_account_id=policy.payout_account_id,
        )

    posting = prepare_rule_posting(session, rule, account)
    return RulePreview(
        rule_id=rule.rule_id,
        amount=abs(posting["amount"]),
        is_debit=posting["is_debit"],
        description=posting["description"],
        period_start=posting["period_start"],
        period_end=posting["period_end"],
        days=posting["days"],
        from_account_id=posting["source_account_id"] or (rule.account_id if posting["target_account_id"] else None),
        to_account_id=posting["target_account_id"],
    )

def enrich_rule(session: Session, rule: Rule) -> RuleRead:
    rule_dict = rule.model_dump()
    config = rule.configuration or {}
    category_id = config.get("category_id")
    if category_id:
        category = session.get(Category, category_id)
        if category:
            rule_dict['category_name'] = category.name
    return RuleRead.model_validate(rule_dict)

def get_rules(session: Session, user_id: str, account_id: str = None):
    user_accounts = session.exec(
        select(Account).where(Account.user_id == user_id)
    ).all()
    user_account_ids = {account.account_id for account in user_accounts}
    open_account_ids = {
        account.account_id
        for account in user_accounts
        if account.status != "Closed"
    }
    all_user_rules = session.exec(
        select(Rule).where(Rule.account_id.in_(user_account_ids))
    ).all() if user_account_ids else []

    visible_rules = []
    for rule in all_user_rules:
        config = rule.configuration or {}
        related_account_ids = {
            rule.account_id,
            config.get("source_account_id"),
            config.get("target_account_id"),
        } - {None}
        if not related_account_ids.issubset(open_account_ids):
            continue
        if account_id and account_id not in related_account_ids:
            continue
        visible_rules.append(rule)

    return visible_rules

def get_rule_with_ownership(session: Session, rule_id: int, user_id: str):
    return session.exec(
        select(Rule)
        .join(Account, Rule.account_id == Account.account_id)
        .where(Rule.rule_id == rule_id)
        .where(Account.user_id == user_id)
    ).first()


def _managed_interest_context(
    session: Session,
    rule_id: int,
    user_id: str,
) -> tuple[Rule, InterestPolicy]:
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        raise ValueError("Rule not found")
    if rule.rule_type != RuleType.INTEREST:
        raise ValueError("This operation is only available for managed interest rules")
    policy_id = (rule.configuration or {}).get("interest_policy_id")
    policy = session.get(InterestPolicy, policy_id) if policy_id else None
    if not policy or policy.account_id != rule.account_id:
        raise ValueError("Managed interest rule has no valid interest policy")
    return rule, policy


def get_interest_rule_schedule(
    session: Session,
    rule_id: int,
    user_id: str,
) -> InterestRuleScheduleRead:
    rule, policy = _managed_interest_context(session, rule_id, user_id)
    executions = session.exec(
        select(InterestExecution)
        .where(InterestExecution.policy_id == policy.policy_id)
        .order_by(InterestExecution.period_start.asc())
    ).all()
    replay_dates = sorted({
        policy.effective_from.date(),
        *(execution.period_start.date() for execution in executions),
    })
    return InterestRuleScheduleRead(
        rule_id=rule.rule_id,
        effective_from=policy.effective_from.date(),
        end_date=policy.end_date.date() if policy.end_date else None,
        next_run_date=rule.next_run_at.date() if rule.next_run_at else None,
        execution_order=rule.execution_order,
        settlement_time_utc=INTEREST_SETTLEMENT_TIME.strftime("%H:%M"),
        replay_from_dates=replay_dates,
    )


def update_interest_rule_schedule(
    session: Session,
    rule_id: int,
    schedule_update: InterestRuleScheduleUpdate,
    user_id: str,
) -> InterestRuleScheduleRead:
    rule, policy = _managed_interest_context(session, rule_id, user_id)
    if rule.is_active:
        raise ValueError("Pause the interest rule before changing its schedule")

    supplied = schedule_update.model_fields_set
    if "next_run_date" in supplied:
        if schedule_update.next_run_date is None:
            rule.next_run_at = None
        else:
            if schedule_update.next_run_date < policy.effective_from.date():
                raise ValueError("Next run date cannot be before the policy effective date")
            rule.next_run_at = interest_settlement_at(schedule_update.next_run_date)

    if "end_date" in supplied:
        if schedule_update.end_date and schedule_update.end_date <= policy.effective_from.date():
            raise ValueError("End date must be after the policy effective date")
        policy.end_date = (
            datetime.combine(schedule_update.end_date, time.min)
            if schedule_update.end_date
            else None
        )
        config = dict(rule.configuration or {})
        if policy.end_date:
            config["end_date"] = policy.end_date.isoformat()
        else:
            config.pop("end_date", None)
        rule.configuration = config
        policy.calculation_version += 1

    if schedule_update.execution_order is not None:
        rule.execution_order = schedule_update.execution_order

    session.add(policy)
    session.add(rule)
    session.commit()
    return get_interest_rule_schedule(session, rule_id, user_id)


def replay_interest_rule_from(
    session: Session,
    rule_id: int,
    replay_from: date,
    user_id: str,
) -> InterestRuleReplayResult:
    """Remove generated settlements from an exact boundary and rewind safely."""
    rule, policy = _managed_interest_context(session, rule_id, user_id)
    if rule.is_active:
        raise ValueError("Pause the interest rule before replaying interest")

    executions = list(session.exec(
        select(InterestExecution)
        .where(InterestExecution.policy_id == policy.policy_id)
        .order_by(InterestExecution.period_start.asc())
    ).all())
    valid_dates = {
        policy.effective_from.date(),
        *(execution.period_start.date() for execution in executions),
    }
    if replay_from not in valid_dates:
        options = ", ".join(value.isoformat() for value in sorted(valid_dates))
        raise ValueError(f"Replay must start at a settlement boundary: {options}")

    removed = [execution for execution in executions if execution.period_start.date() >= replay_from]
    transaction_ids = {
        execution.transaction_id for execution in removed if execution.transaction_id is not None
    }
    removed_execution_ids = {execution.execution_id for execution in removed}

    rule_executions = list(session.exec(
        select(RuleExecution).where(RuleExecution.rule_id == rule.rule_id)
    ).all())
    for audit in rule_executions:
        matches_period = audit.period_start and audit.period_start.date() >= replay_from
        if matches_period or audit.transaction_id in transaction_ids:
            session.delete(audit)

    for execution in removed:
        session.delete(execution)
    for transaction_id in transaction_ids:
        transaction = session.get(Transaction, transaction_id)
        if transaction:
            session.delete(transaction)

    if removed:
        first_period_end = min(execution.period_end for execution in removed)
        rule.next_run_at = interest_settlement_at(first_period_end)
    else:
        account = session.get(Account, rule.account_id)
        if not account:
            raise ValueError("Account not found")
        frequency = (rule.configuration or {}).get("frequency")
        if frequency == "ONE_TIME":
            first_due = policy.end_date or policy.effective_from
        else:
            first_due = advance_run_date(
                frequency,
                make_aware(policy.effective_from),
            )
        rule.next_run_at = interest_settlement_at(first_due)

    policy.calculation_version += 1
    session.add(policy)
    session.add(rule)
    session.commit()

    return InterestRuleReplayResult(
        schedule=get_interest_rule_schedule(session, rule_id, user_id),
        removed_executions=len(removed_execution_ids),
        removed_transactions=len(transaction_ids),
    )

def create_rule(session: Session, rule_in: RuleCreate, user_id: str):
    account = session.get(Account, rule_in.account_id)
    if not account or account.user_id != user_id:
        return None

    # Reject broken configurations (bad formula, missing keys, unknown
    # frequency) at creation time instead of at execution time inside Celery.
    validate_rule_configuration(rule_in.rule_type, rule_in.configuration)

    rule = Rule.model_validate(rule_in)
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule

def update_rule(session: Session, rule_id: int, rule_update: RuleUpdate, user_id: str):
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        return None

    rule_data = rule_update.model_dump(exclude_unset=True)

    if rule.rule_type == RuleType.INTEREST:
        protected_schedule_fields = {"next_run_at", "execution_order", "configuration", "rule_type"}
        if protected_schedule_fields.intersection(rule_data):
            raise ValueError(
                "Pause the rule and use the managed interest schedule controls to change dates or order"
            )

    effective_type = rule_data.get("rule_type", rule.rule_type)
    if "configuration" in rule_data or "rule_type" in rule_data:
        effective_config = rule_data.get("configuration", rule.configuration)
        validate_rule_configuration(effective_type, effective_config)

    for key, value in rule_data.items():
        setattr(rule, key, value)

    if rule.rule_type == RuleType.INTEREST:
        config = rule.configuration or {}
        policy = session.get(InterestPolicy, config.get("interest_policy_id"))
        if not policy or policy.account_id != rule.account_id:
            raise ValueError("Managed interest rule has no valid interest policy")
        if config.get("frequency"):
            policy.settlement_frequency = config["frequency"]
        if "end_date" in config:
            policy.end_date = (
                datetime.fromisoformat(config["end_date"]).replace(tzinfo=None)
                if config["end_date"]
                else None
            )
        if "is_active" in rule_data:
            policy.enabled = rule.is_active
        policy.calculation_version += 1
        session.add(policy)

    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule

def delete_rule(session: Session, rule_id: int, user_id: str):
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        return False

    session.delete(rule)
    session.commit()
    return True

def execute_rule_now_core(session: Session, rule_id: int, user_id: str):
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        raise ValueError("Rule not found")

    if not rule.is_active:
        raise ValueError("Resume the rule before executing it")

    if rule.rule_type not in SCHEDULABLE_RULE_TYPES:
        raise ValueError("Only transaction or calculation rules can be manually executed.")

    account = session.get(Account, rule.account_id)
    if account and account.status == "Closed":
        raise ValueError("Account is closed; this rule cannot be executed.")

    if rule.rule_type == RuleType.INTEREST:
        if not account:
            raise ValueError("Account not found")
        now_utc = datetime.now(timezone.utc)
        if rule.next_run_at and make_aware(rule.next_run_at) > now_utc:
            raise ValueError("Managed interest cannot be settled before its scheduled date; use preview instead")
        process_interest_rule(session, rule, account)
    else:
        process_single_rule(session, rule)
    session.refresh(rule)
    return rule

def upsert_managed_interest_rule(session: Session, account: Account, policy: InterestPolicy) -> Rule:
    """Create or synchronize the scheduler rule for an InterestPolicy."""
    frequency = policy.settlement_frequency
    existing = session.exec(
        select(Rule).where(
            Rule.account_id == account.account_id,
            Rule.rule_type == RuleType.INTEREST,
        )
    ).first()

    effective_from = make_aware(policy.effective_from)
    if frequency == "ONE_TIME":
        next_run = make_aware(policy.end_date) or effective_from
    else:
        seed = effective_from
        next_run = advance_run_date(
            frequency,
            seed,
        )
        if policy.end_date:
            next_run = min(next_run, make_aware(policy.end_date))

    config = {
        "interest_policy_id": policy.policy_id,
        "action": "SETTLE",
        "frequency": frequency,
        "effective_from": effective_from.isoformat(),
    }
    if policy.end_date:
        config["end_date"] = make_aware(policy.end_date).isoformat()

    rule = existing or Rule(
        account_id=account.account_id,
        name=f"Managed Interest - {account.account_name}",
        rule_type=RuleType.INTEREST,
        execution_order=INTEREST_EXECUTION_ORDER,
    )
    frequency_changed = (rule.configuration or {}).get("frequency") != frequency
    rule.name = f"Managed Interest - {account.account_name}"
    rule.configuration = config
    if not existing:
        rule.execution_order = INTEREST_EXECUTION_ORDER
    rule.is_active = policy.enabled and account.status != "Closed"
    if not rule.is_active:
        rule.next_run_at = None
    elif rule.next_run_at is None or frequency_changed or not existing:
        rule.next_run_at = interest_settlement_at(next_run)
    elif policy.end_date and make_aware(rule.next_run_at) > make_aware(policy.end_date):
        rule.next_run_at = interest_settlement_at(policy.end_date)
    session.add(rule)
    session.flush()
    return rule

def create_rd_auto_deposit_rule(session: Session, rd_account: Account):
    metadata_ = rd_account.metadata_ or {}
    if not metadata_.get("is_auto_deposit") or not metadata_.get("linked_account_id"):
        return None

    linked_account_id = metadata_["linked_account_id"]
    deposit_amount = metadata_["deposit_amount"]
    start_date_str = metadata_["start_date"]
    rule_name = f"Auto Deposit - {rd_account.account_name}"

    start_date = datetime.fromisoformat(start_date_str).replace(tzinfo=timezone.utc)
    # The first installment is due on the RD start date.
    next_run = datetime.combine(start_date, time(1, 0), tzinfo=timezone.utc)

    end_date = None
    if metadata_.get('maturity_date'):
        end_date = datetime.fromisoformat(metadata_['maturity_date']).replace(tzinfo=timezone.utc)

    config = {
        "transaction_amount": str(deposit_amount),
        "frequency": "MONTHLY",
        "target_account_id": rd_account.account_id,
    }
    if end_date:
        config["end_date"] = end_date.isoformat()

    deposit_rule = Rule(
        account_id=linked_account_id,
        name=rule_name,
        rule_type=RuleType.TRANSACTION,
        configuration=config,
        next_run_at=next_run,
        is_active=True
    )
    session.add(deposit_rule)
    return deposit_rule

def create_loan_auto_debit_rule(session: Session, loan_account: Account):
    metadata_ = loan_account.metadata_ or {}
    existing = session.exec(
        select(Rule).where(
            Rule.account_id == loan_account.account_id,
            Rule.rule_type == RuleType.TRANSACTION,
            Rule.name.like("Auto Debit - %"),
        )
    ).first()

    if not metadata_.get("is_auto_debit") or not metadata_.get("linked_account_id"):
        if existing:
            existing.is_active = False
            existing.next_run_at = None
            session.add(existing)
        return existing

    linked_account_id = metadata_["linked_account_id"]
    emi_amount = metadata_["emi_amount"]

    rule_name = f"Auto Debit - {loan_account.account_name}"

    start_date_str = metadata_["emi_start_date"]
    next_run = interest_settlement_at(datetime.fromisoformat(start_date_str))
    contract_end = (
        datetime.fromisoformat(metadata_["start_date"])
        + relativedelta(months=int(metadata_["tenure_months"]))
    )

    config = {
        "transaction_amount": str(emi_amount),
        "frequency": "MONTHLY",
        "source_account_id": linked_account_id,
        "target_account_id": loan_account.account_id,
        "first_payment_date": start_date_str,
    }
    # Transaction-rule end dates are exclusive. The final EMI is due on the
    # contract end date, so keep the schedule open through that day.
    config["end_date"] = (contract_end + relativedelta(days=1)).isoformat()

    debit_rule = existing or Rule(
        account_id=loan_account.account_id,
        name=rule_name,
        rule_type=RuleType.TRANSACTION,
    )
    schedule_changed = (debit_rule.configuration or {}).get("first_payment_date") != start_date_str
    debit_rule.name = rule_name
    debit_rule.configuration = config
    debit_rule.execution_order = LOAN_PAYMENT_EXECUTION_ORDER
    debit_rule.is_active = loan_account.status != "Closed"
    if debit_rule.next_run_at is None or schedule_changed:
        debit_rule.next_run_at = next_run
    session.add(debit_rule)
    return debit_rule
