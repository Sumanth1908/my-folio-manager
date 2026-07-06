from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlmodel import select

from app.models import Account, AccountType, RuleExecution, RuleExecutionStatus, Transaction
from app.models.rule import Rule, RuleType
from app.schemas.rule import validate_rule_configuration
from app.services.rules_service import (compute_next_run, process_single_rule,
                                        replace_day_clamped)
from tests.conftest import make_account, seed_transaction


def _naive_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def make_rule(session, account, rule_type=RuleType.CALCULATION, config=None, next_run_delta_days=-1):
    rule = Rule(
        account_id=account.account_id,
        name="Test Rule",
        rule_type=rule_type,
        configuration=config or {},
        next_run_at=_naive_now() + timedelta(days=next_run_delta_days),
        is_active=True,
    )
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


class TestReplaceDayClamped:
    def test_short_month_clamps(self):
        assert replace_day_clamped(datetime(2026, 2, 15), 31).day == 28

    def test_leap_february(self):
        assert replace_day_clamped(datetime(2028, 2, 15), 30).day == 29

    def test_normal_day_unchanged(self):
        assert replace_day_clamped(datetime(2026, 3, 15), 10).day == 10


class TestComputeNextRun:
    def test_monthly_calculation_clamps_accrual_day(self, session, user):
        # accrual day 31, moving Jan → Feb, must clamp instead of crashing
        account = make_account(session, user, metadata={"interest_accrual_day": 31})
        rule = make_rule(session, account, config={"frequency": "MONTHLY"})
        rule.next_run_at = datetime(2026, 1, 31)

        next_run, active = compute_next_run(rule, account, "MONTHLY", datetime(2026, 1, 31, tzinfo=timezone.utc))
        assert active is True
        assert next_run.month == 2
        assert next_run.day == 28

    def test_unknown_frequency_deactivates(self, session, user):
        account = make_account(session, user)
        rule = make_rule(session, account, config={"frequency": "MONTLY"})  # typo on purpose

        next_run, active = compute_next_run(rule, account, "MONTLY", datetime.now(timezone.utc))
        assert next_run is None
        assert active is False

    def test_one_time_deactivates(self, session, user):
        account = make_account(session, user)
        rule = make_rule(session, account, config={"frequency": "ONE_TIME"})

        next_run, active = compute_next_run(rule, account, "ONE_TIME", datetime.now(timezone.utc))
        assert next_run is None
        assert active is False

    def test_end_date_deactivates(self, session, user):
        account = make_account(session, user)
        end = (_naive_now() + timedelta(days=5)).isoformat()
        rule = make_rule(session, account, config={"frequency": "MONTHLY", "end_date": end})

        next_run, active = compute_next_run(rule, account, "MONTHLY", datetime.now(timezone.utc))
        assert active is False


class TestProcessSingleRule:
    def test_posts_interest_and_records_execution(self, session, user):
        account = make_account(session, user, metadata={"interest_rate": 12.0})
        seed_transaction(session, account, 1000, days_ago=60)
        rule = make_rule(session, account, config={
            "formula": "balance * (interest_rate / 100) / 12",
            "frequency": "MONTHLY",
        })

        process_single_rule(session, rule)

        txs = session.exec(
            select(Transaction).where(Transaction.account_id == account.account_id)
        ).all()
        assert len(txs) == 2  # seed + posted interest
        interest_tx = [t for t in txs if t.description.startswith("Auto:")][0]
        assert interest_tx.amount == Decimal("10.00")

        executions = session.exec(select(RuleExecution)).all()
        assert len(executions) == 1
        assert executions[0].status == RuleExecutionStatus.SUCCESS
        assert executions[0].transaction_id == interest_tx.transaction_id

        session.refresh(rule)
        assert rule.next_run_at > _naive_now()  # schedule advanced
        assert rule.is_active is True

    def test_closed_account_deactivates_rule(self, session, user):
        account = make_account(session, user, status="Closed")
        rule = make_rule(session, account, rule_type=RuleType.TRANSACTION,
                         config={"transaction_amount": "100", "frequency": "MONTHLY"})

        process_single_rule(session, rule)

        session.refresh(rule)
        assert rule.is_active is False
        txs = session.exec(select(Transaction)).all()
        assert txs == []
        executions = session.exec(select(RuleExecution)).all()
        assert executions[0].status == RuleExecutionStatus.SKIPPED

    def test_zero_amount_skips_but_advances_schedule(self, session, user):
        account = make_account(session, user, metadata={"interest_rate": 12.0})
        # No transactions → zero balance → zero interest
        rule = make_rule(session, account, config={
            "formula": "balance * (interest_rate / 100) / 12",
            "frequency": "MONTHLY",
        })

        process_single_rule(session, rule)

        txs = session.exec(select(Transaction)).all()
        assert txs == []
        executions = session.exec(select(RuleExecution)).all()
        assert executions[0].status == RuleExecutionStatus.SKIPPED
        session.refresh(rule)
        assert rule.is_active is True
        assert rule.next_run_at > _naive_now()

    def test_transfer_rule_posts_both_legs(self, session, user):
        savings = make_account(session, user, name="Savings")
        rd = make_account(session, user, account_type=AccountType.RECURRING_DEPOSIT, name="RD")
        seed_transaction(session, savings, 5000, days_ago=10)
        rule = make_rule(session, savings, rule_type=RuleType.TRANSACTION, config={
            "transaction_amount": "500",
            "frequency": "MONTHLY",
            "target_account_id": rd.account_id,
        })

        process_single_rule(session, rule)

        rd_txs = session.exec(select(Transaction).where(Transaction.account_id == rd.account_id)).all()
        savings_txs = session.exec(select(Transaction).where(Transaction.account_id == savings.account_id)).all()
        assert len(rd_txs) == 1 and rd_txs[0].amount == Decimal("500.00")
        # seed + debit leg
        assert len(savings_txs) == 2
        debit = [t for t in savings_txs if t.amount < 0][0]
        assert debit.amount == Decimal("-500.00")
        assert debit.transfer_id == rd_txs[0].transfer_id


class TestConfigurationValidation:
    def test_valid_calculation_config(self):
        validate_rule_configuration(RuleType.CALCULATION, {
            "formula": "balance * (interest_rate / 100) / 365 * days",
            "frequency": "MONTHLY",
        })

    def test_frequency_typo_rejected(self):
        with pytest.raises(ValueError):
            validate_rule_configuration(RuleType.CALCULATION, {
                "formula": "balance * 2",
                "frequency": "MONTLY",
            })

    def test_bad_formula_rejected(self):
        with pytest.raises(ValueError):
            validate_rule_configuration(RuleType.CALCULATION, {
                "formula": "balance * nonexistent_variable",
                "frequency": "MONTHLY",
            })

    def test_transaction_rule_requires_positive_amount(self):
        with pytest.raises(ValueError):
            validate_rule_configuration(RuleType.TRANSACTION, {
                "transaction_amount": "0",
                "frequency": "MONTHLY",
            })

    def test_categorization_requires_matcher(self):
        with pytest.raises(ValueError):
            validate_rule_configuration(RuleType.CATEGORIZATION, {"category_id": 1})
