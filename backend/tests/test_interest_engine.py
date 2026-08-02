from datetime import datetime, timedelta, timezone
from decimal import Decimal

from dateutil.relativedelta import relativedelta
import pytest
from sqlmodel import select

from app.models import (
    AccountType,
    Category,
    InterestExecution,
    InterestPolicy,
    InterestRatePeriod,
    RuleExecution,
    Transaction,
)
from app.models.rule import Rule, RuleType
from app.schemas.account import AccountCreate
from app.schemas.interest import InterestPolicyCreate, InterestPreviewRequest
from app.schemas.rule import InterestRuleScheduleUpdate
from app.services.account_service import create_account, normalize_car_loan_metadata
from app.services.interest_service import preview_interest
from app.services.interest_service import calculate_policy_period
from app.services.rules_service import process_single_rule
from app.services.rules_service import (
    replay_interest_rule_from,
    update_interest_rule_schedule,
)
from tests.conftest import make_account, seed_transaction


def _naive_utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def test_interest_policy_normalizes_mixed_timezone_terms():
    policy = InterestPolicyCreate(
        annual_rate=Decimal("7.5"),
        effective_from=datetime(2026, 1, 1, tzinfo=timezone.utc),
        end_date=datetime(2027, 1, 1),
    )

    assert policy.effective_from == datetime(2026, 1, 1)
    assert policy.effective_from.tzinfo is None
    assert policy.end_date == datetime(2027, 1, 1)


def test_account_creation_provisions_managed_interest_rule(session, user):
    effective = _naive_utc_now()
    account = create_account(
        session,
        AccountCreate(
            account_name="Managed saver",
            account_type=AccountType.SAVINGS,
            interest_policy=InterestPolicyCreate(
                annual_rate=Decimal("4.5"),
                effective_from=effective,
                settlement_frequency="QUARTERLY",
            ),
        ),
        user.user_id,
    )

    policy = session.exec(
        select(InterestPolicy).where(InterestPolicy.account_id == account.account_id)
    ).one()
    rule = session.exec(select(Rule).where(Rule.account_id == account.account_id)).one()

    assert account.is_interest_enabled is True
    assert policy.annual_rate == Decimal("4.500000")
    assert rule.rule_type == RuleType.INTEREST
    assert rule.configuration["interest_policy_id"] == policy.policy_id
    assert rule.configuration["frequency"] == "QUARTERLY"
    assert rule.execution_order == 900
    assert (rule.next_run_at.hour, rule.next_run_at.minute) == (23, 55)


def test_interest_enabled_account_requires_managed_policy(session, user):
    with pytest.raises(ValueError, match="interest policy is required"):
        create_account(
            session,
            AccountCreate(
                account_name="Incomplete saver",
                account_type=AccountType.SAVINGS,
                is_interest_enabled=True,
            ),
            user.user_id,
        )
    session.rollback()


def test_car_loan_defaults_calculate_emi_and_pay_interest_before_principal(session, user):
    source = make_account(session, user, account_type=AccountType.SAVINGS, name="EMI source")
    seed_transaction(session, source, 50000, days_ago=60)
    start = (_naive_utc_now() - relativedelta(months=1)).date().isoformat()
    loan = create_account(
        session,
        AccountCreate(
            account_name="Car loan",
            account_type=AccountType.LOAN,
            metadata_={
                "loan_amount": 12000,
                "interest_rate": 12,
                "tenure_months": 12,
                "start_date": start,
                "is_auto_debit": True,
                "linked_account_id": source.account_id,
            },
            # Loan policy terms are backend-managed; metadata remains the
            # single source of truth if a client also sends a policy object.
            interest_policy=InterestPolicyCreate(
                annual_rate=Decimal("99"),
                effective_from=datetime(2025, 1, 1, tzinfo=timezone.utc),
            ),
        ),
        user.user_id,
    )

    policy = session.exec(
        select(InterestPolicy).where(InterestPolicy.account_id == loan.account_id)
    ).one()
    rules = session.exec(select(Rule).where(Rule.account_id == loan.account_id)).all()
    interest_rule = next(rule for rule in rules if rule.rule_type == RuleType.INTEREST)
    payment_rule = next(rule for rule in rules if rule.rule_type == RuleType.TRANSACTION)

    assert loan.is_interest_enabled is True
    assert loan.metadata_["emi_amount"] == 1066.19
    assert loan.metadata_["emi_start_date"] == (
        datetime.fromisoformat(start) + relativedelta(months=1)
    ).date().isoformat()
    assert policy.annual_rate == Decimal("12.000000")
    assert policy.effective_from == datetime.fromisoformat(start)
    assert policy.direction == "CHARGED"
    assert policy.balance_basis == "PRINCIPAL_OUTSTANDING"
    assert policy.day_count == "THIRTY_360"
    assert policy.treatment == "INTEREST_DUE"
    assert policy.settlement_frequency == "MONTHLY"
    assert interest_rule.execution_order == 900
    assert payment_rule.execution_order == 950
    assert len(rules) == 2
    assert interest_rule.next_run_at == payment_rule.next_run_at
    assert (interest_rule.next_run_at.hour, interest_rule.next_run_at.minute) == (23, 55)

    due = _naive_utc_now() - timedelta(minutes=1)
    interest_rule.next_run_at = due
    payment_rule.next_run_at = due
    session.add(interest_rule)
    session.add(payment_rule)
    session.commit()

    process_single_rule(session, interest_rule)
    session.refresh(loan)
    assert loan.metadata_["interest_balance"] > 0

    process_single_rule(session, payment_rule)
    session.refresh(loan)
    assert loan.metadata_["interest_balance"] == 0
    assert loan.metadata_["principal_balance"] < 12000


def test_car_loan_terms_calculate_tenure_from_emi():
    terms = normalize_car_loan_metadata({
        "loan_amount": 12000,
        "interest_rate": 12,
        "emi_amount": 1066.19,
        "start_date": "2026-01-15",
    })

    assert terms["tenure_months"] == 12
    assert terms["emi_start_date"] == "2026-02-15"


def test_paused_interest_rule_can_rewind_and_edit_schedule(session, user):
    account = make_account(session, user, account_type=AccountType.SAVINGS)
    start = (_naive_utc_now() - relativedelta(months=2)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    seed_transaction(session, account, 1000, days_ago=100)
    policy = InterestPolicy(
        account_id=account.account_id,
        annual_rate=Decimal("12"),
        effective_from=start,
        direction="EARNED",
        balance_basis="LEDGER_BALANCE",
        day_count="ACTUAL_365",
        treatment="CAPITALIZE",
        settlement_frequency="MONTHLY",
    )
    session.add(policy)
    session.flush()
    rule = Rule(
        account_id=account.account_id,
        name="Managed Interest",
        rule_type=RuleType.INTEREST,
        configuration={
            "interest_policy_id": policy.policy_id,
            "action": "SETTLE",
            "frequency": "MONTHLY",
        },
        next_run_at=start + relativedelta(months=1),
        execution_order=900,
        is_active=True,
    )
    session.add(rule)
    session.commit()

    process_single_rule(session, rule)
    assert session.exec(select(InterestExecution)).all()

    rule.is_active = False
    session.add(rule)
    session.commit()
    result = replay_interest_rule_from(
        session, rule.rule_id, start.date(), user.user_id
    )

    assert result.removed_executions >= 1
    assert result.removed_transactions >= 1
    assert session.exec(select(InterestExecution)).all() == []
    assert session.exec(
        select(Transaction).where(Transaction.transaction_kind == "INTEREST_CAPITALIZATION")
    ).all() == []
    assert (rule.next_run_at.hour, rule.next_run_at.minute) == (23, 55)
    assert rule.is_active is False

    new_next_run = (_naive_utc_now() + timedelta(days=5)).date()
    schedule = update_interest_rule_schedule(
        session,
        rule.rule_id,
        InterestRuleScheduleUpdate(
            next_run_date=new_next_run,
            execution_order=750,
        ),
        user.user_id,
    )
    assert schedule.next_run_date == new_next_run
    assert schedule.execution_order == 750
    assert schedule.settlement_time_utc == "23:55"


def test_managed_interest_catches_up_each_period_and_compounds(session, user):
    account = make_account(session, user, account_type=AccountType.SAVINGS)
    start = (_naive_utc_now() - relativedelta(months=3)).replace(hour=0, minute=0, second=0, microsecond=0)
    seed_transaction(session, account, 1000, days_ago=120)
    policy = InterestPolicy(
        account_id=account.account_id,
        annual_rate=Decimal("12"),
        effective_from=start,
        direction="EARNED",
        balance_basis="LEDGER_BALANCE",
        day_count="ACTUAL_365",
        treatment="CAPITALIZE",
        settlement_frequency="MONTHLY",
    )
    session.add(policy)
    session.flush()
    rule = Rule(
        account_id=account.account_id,
        name="Managed Interest",
        rule_type=RuleType.INTEREST,
        configuration={
            "interest_policy_id": policy.policy_id,
            "action": "SETTLE",
            "frequency": "MONTHLY",
        },
        next_run_at=start + relativedelta(months=1),
        is_active=True,
    )
    session.add(rule)
    session.commit()

    process_single_rule(session, rule)

    executions = session.exec(
        select(InterestExecution)
        .where(InterestExecution.policy_id == policy.policy_id)
        .order_by(InterestExecution.period_end)
    ).all()
    interest_transactions = session.exec(
        select(Transaction).where(Transaction.transaction_kind == "INTEREST_CAPITALIZATION")
    ).all()
    rule_executions = session.exec(select(RuleExecution).where(RuleExecution.rule_id == rule.rule_id)).all()

    assert len(executions) == 3
    assert len(interest_transactions) == 3
    assert len(rule_executions) == 3
    assert executions[1].eligible_balance > executions[0].eligible_balance
    assert rule.next_run_at > _naive_utc_now()


def test_non_cumulative_interest_pays_target_without_changing_principal(session, user):
    deposit = make_account(
        session,
        user,
        account_type=AccountType.FIXED_DEPOSIT,
        metadata={"principal_amount": 1000},
        name="Non cumulative FD",
    )
    payout = make_account(session, user, account_type=AccountType.SAVINGS, name="Payout")
    start = _naive_utc_now() - timedelta(days=30)
    seed_transaction(session, deposit, 1000, days_ago=40)
    policy = InterestPolicy(
        account_id=deposit.account_id,
        annual_rate=Decimal("12"),
        effective_from=start,
        direction="EARNED",
        balance_basis="FIXED_PRINCIPAL",
        day_count="ACTUAL_365",
        treatment="PAYOUT",
        settlement_frequency="MONTHLY",
        payout_account_id=payout.account_id,
    )
    session.add(policy)
    session.flush()
    rule = Rule(
        account_id=deposit.account_id,
        name="Managed Interest",
        rule_type=RuleType.INTEREST,
        configuration={"interest_policy_id": policy.policy_id, "action": "SETTLE", "frequency": "MONTHLY"},
        next_run_at=_naive_utc_now() - timedelta(minutes=1),
        is_active=True,
    )
    session.add(rule)
    session.commit()

    process_single_rule(session, rule)

    deposit_transactions = session.exec(
        select(Transaction).where(Transaction.account_id == deposit.account_id)
    ).all()
    payout_transactions = session.exec(
        select(Transaction).where(Transaction.account_id == payout.account_id)
    ).all()
    assert sum(tx.amount for tx in deposit_transactions) == Decimal("1000.00")
    assert len(payout_transactions) == 1
    assert payout_transactions[0].amount > 0
    assert payout_transactions[0].transaction_kind == "INTEREST_PAYOUT"


def test_non_cumulative_interest_can_pay_into_same_fd_account(session, user):
    deposit = make_account(
        session,
        user,
        account_type=AccountType.FIXED_DEPOSIT,
        metadata={"principal_amount": 1000},
        name="Self payout FD",
    )
    start = _naive_utc_now() - timedelta(days=30)
    seed_transaction(session, deposit, 1000, days_ago=40)
    interest_category = Category(user_id=user.user_id, name="Interest income")
    session.add(interest_category)
    session.flush()
    policy = InterestPolicy(
        account_id=deposit.account_id,
        annual_rate=Decimal("12"),
        effective_from=start,
        direction="EARNED",
        balance_basis="FIXED_PRINCIPAL",
        day_count="ACTUAL_365",
        treatment="PAYOUT",
        settlement_frequency="MONTHLY",
        payout_account_id=None,
        category_id=interest_category.category_id,
    )
    session.add(policy)
    session.flush()
    rule = Rule(
        account_id=deposit.account_id,
        name="Managed Interest",
        rule_type=RuleType.INTEREST,
        configuration={"interest_policy_id": policy.policy_id, "action": "SETTLE", "frequency": "MONTHLY"},
        next_run_at=_naive_utc_now() - timedelta(minutes=1),
        is_active=True,
    )
    session.add(rule)
    session.commit()

    process_single_rule(session, rule)

    transactions = session.exec(
        select(Transaction).where(Transaction.account_id == deposit.account_id)
    ).all()
    payout = next(tx for tx in transactions if tx.transaction_kind == "INTEREST_PAYOUT")
    assert payout.amount > 0
    assert payout.category_id == interest_category.category_id
    assert sum(tx.amount for tx in transactions) > Decimal("1000.00")
    assert policy.balance_basis == "FIXED_PRINCIPAL"


def test_rd_preview_uses_contribution_schedule(session):
    preview = preview_interest(
        InterestPreviewRequest(
            account_type="RECURRING_DEPOSIT",
            metadata_={"deposit_amount": 1000},
            policy=InterestPolicyCreate(
                annual_rate=Decimal("6"),
                effective_from=datetime(2026, 1, 1),
                end_date=datetime(2027, 1, 1),
                settlement_frequency="QUARTERLY",
            ),
        )
    )

    assert preview.projected_maturity_amount is not None
    assert preview.projected_maturity_amount > Decimal("12000")
    assert preview.projected_maturity_amount < Decimal("13000")
    assert preview.estimated_interest > 0


def test_non_cumulative_rd_preview_separates_deposits_and_interest(session):
    preview = preview_interest(
        InterestPreviewRequest(
            account_type="RECURRING_DEPOSIT",
            metadata_={"deposit_amount": 1000},
            policy=InterestPolicyCreate(
                annual_rate=Decimal("6"),
                effective_from=datetime(2026, 1, 1),
                end_date=datetime(2027, 1, 1),
                treatment="PAYOUT",
                settlement_frequency="QUARTERLY",
            ),
        )
    )

    assert preview.projected_maturity_amount == Decimal("12000.00")
    assert preview.estimated_interest > 0


def test_rd_auto_deposit_keeps_start_date_day_for_monthly_schedule(session, user):
    source = make_account(session, user, account_type=AccountType.SAVINGS, name="RD source")
    rd = create_account(
        session,
        AccountCreate(
            account_name="Scheduled RD",
            account_type=AccountType.RECURRING_DEPOSIT,
            metadata_={
                "deposit_amount": 1000,
                "start_date": "2026-01-15",
                "deposit_day": 15,
                "tenure_months": 12,
                "is_auto_deposit": True,
                "linked_account_id": source.account_id,
            },
        ),
        user.user_id,
    )

    rule = next(
        candidate
        for candidate in session.exec(
            select(Rule).where(Rule.rule_type == RuleType.TRANSACTION)
        ).all()
        if candidate.configuration.get("target_account_id") == rd.account_id
    )
    assert "day_of_month" not in rule.configuration
    assert "deposit_day" not in rd.metadata_
    assert "tenure_months" not in rd.metadata_
    assert rd.metadata_["maturity_date"] == "2027-01-15"


def test_rate_change_splits_an_open_interest_period(session, user):
    account = make_account(
        session,
        user,
        account_type=AccountType.FIXED_DEPOSIT,
        metadata={"principal_amount": 1000},
    )
    start = datetime(2026, 1, 1)
    policy = InterestPolicy(
        account_id=account.account_id,
        annual_rate=Decimal("20"),
        effective_from=start,
        balance_basis="FIXED_PRINCIPAL",
        day_count="ACTUAL_365",
        treatment="CAPITALIZE",
        settlement_frequency="MONTHLY",
    )
    session.add(policy)
    session.flush()
    session.add(InterestRatePeriod(
        policy_id=policy.policy_id,
        annual_rate=Decimal("10"),
        effective_from=start,
    ))
    session.add(InterestRatePeriod(
        policy_id=policy.policy_id,
        annual_rate=Decimal("20"),
        effective_from=datetime(2026, 1, 11),
    ))
    session.commit()

    days, balance, amount = calculate_policy_period(
        session, account, policy, start, datetime(2026, 1, 21)
    )

    assert days == 20
    assert balance == Decimal("1000")
    assert amount == Decimal("8.22")
