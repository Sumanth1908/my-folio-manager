from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlmodel import select

from app.models import AccountType, InterestPolicy, RuleExecution, RuleExecutionStatus, Transaction
from app.models.rule import Rule, RuleType
from app.schemas.rule import validate_rule_configuration
from app.services.rules_service import compute_next_run, get_rules, process_single_rule
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


class TestComputeNextRun:
    def test_monthly_cadence_uses_scheduled_execution_date(self, session, user):
        account = make_account(session, user)
        rule = make_rule(session, account, config={"frequency": "MONTHLY"})
        rule.next_run_at = datetime(2026, 1, 31)

        next_run, active = compute_next_run(rule, datetime(2026, 1, 31, tzinfo=timezone.utc))
        assert active is True
        assert next_run == datetime(2026, 2, 28, tzinfo=timezone.utc)

    def test_unknown_frequency_deactivates(self, session, user):
        account = make_account(session, user)
        rule = make_rule(session, account, config={"frequency": "MONTLY"})  # typo on purpose

        next_run, active = compute_next_run(rule, datetime.now(timezone.utc))
        assert next_run is None
        assert active is False

    def test_quarterly_cadence_adds_three_months(self, session, user):
        account = make_account(session, user)
        rule = make_rule(session, account, config={"frequency": "QUARTERLY"})
        rule.next_run_at = datetime(2026, 1, 31)

        next_run, active = compute_next_run(
            rule,
            datetime(2026, 1, 31, tzinfo=timezone.utc),
        )

        assert active is True
        assert next_run == datetime(2026, 4, 30, tzinfo=timezone.utc)

    def test_one_time_deactivates(self, session, user):
        account = make_account(session, user)
        rule = make_rule(session, account, config={"frequency": "ONE_TIME"})

        next_run, active = compute_next_run(rule, datetime.now(timezone.utc))
        assert next_run is None
        assert active is False

    def test_end_date_deactivates(self, session, user):
        account = make_account(session, user)
        end = (_naive_now() + timedelta(days=5)).isoformat()
        rule = make_rule(session, account, config={"frequency": "MONTHLY", "end_date": end})

        next_run, active = compute_next_run(rule, datetime.now(timezone.utc))
        assert active is False

    def test_overdue_monthly_rule_preserves_historical_cadence(self, session, user):
        account = make_account(session, user)
        rule = make_rule(session, account, config={"frequency": "MONTHLY"})
        rule.next_run_at = datetime(2025, 12, 24, 10)

        next_run, active = compute_next_run(
            rule,
            datetime(2026, 8, 2, tzinfo=timezone.utc),
        )

        assert active is True
        assert next_run == datetime(2026, 1, 24, 10, tzinfo=timezone.utc)


class TestProcessSingleRule:
    def test_rd_formula_uses_managed_rate_and_installment_amount(self, session, user):
        account = make_account(
            session,
            user,
            account_type=AccountType.RECURRING_DEPOSIT,
            metadata={"deposit_amount": 1000},
        )
        session.add(InterestPolicy(
            account_id=account.account_id,
            annual_rate=Decimal("12"),
            effective_from=_naive_now(),
        ))
        session.commit()
        rule = make_rule(session, account, config={
            "formula": "deposit_amount * (interest_rate / 100)",
            "frequency": "ONE_TIME",
        })

        process_single_rule(session, rule)

        posted = session.exec(
            select(Transaction).where(Transaction.account_id == account.account_id)
        ).one()
        assert posted.amount == Decimal("120.00")

    def test_posts_interest_and_records_execution(self, session, user):
        account = make_account(session, user)
        session.add(InterestPolicy(
            account_id=account.account_id,
            annual_rate=Decimal("12"),
            effective_from=_naive_now(),
        ))
        session.commit()
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
        account = make_account(session, user)
        session.add(InterestPolicy(
            account_id=account.account_id,
            annual_rate=Decimal("12"),
            effective_from=_naive_now(),
        ))
        session.commit()
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


class TestRuleListing:
    def test_closed_account_rules_are_hidden_from_linked_and_global_views(self, session, user):
        savings = make_account(session, user, name="Savings")
        closed_loan = make_account(
            session,
            user,
            account_type=AccountType.LOAN,
            name="Closed loan",
            status="Closed",
        )
        visible = Rule(
            account_id=savings.account_id,
            name="Visible savings rule",
            rule_type=RuleType.TRANSACTION,
            configuration={"transaction_amount": "10", "frequency": "MONTHLY"},
        )
        owned_by_closed = Rule(
            account_id=closed_loan.account_id,
            name="Closed loan auto debit",
            rule_type=RuleType.TRANSACTION,
            configuration={
                "transaction_amount": "100",
                "frequency": "MONTHLY",
                "source_account_id": savings.account_id,
                "target_account_id": closed_loan.account_id,
            },
        )
        targets_closed = Rule(
            account_id=savings.account_id,
            name="Transfer to closed loan",
            rule_type=RuleType.TRANSACTION,
            configuration={
                "transaction_amount": "100",
                "frequency": "MONTHLY",
                "target_account_id": closed_loan.account_id,
            },
        )
        session.add(visible)
        session.add(owned_by_closed)
        session.add(targets_closed)
        session.commit()

        savings_rules = get_rules(session, user.user_id, savings.account_id)
        global_rules = get_rules(session, user.user_id)

        assert [rule.name for rule in savings_rules] == ["Visible savings rule"]
        assert [rule.name for rule in global_rules] == ["Visible savings rule"]


class TestConfigurationValidation:
    def test_valid_calculation_config(self):
        validate_rule_configuration(RuleType.CALCULATION, {
            "formula": "balance * (interest_rate / 100) / 365 * days",
            "frequency": "MONTHLY",
        })

    def test_quarterly_frequency_is_valid(self):
        validate_rule_configuration(RuleType.CALCULATION, {
            "formula": "balance * (interest_rate / 100) / 365 * days",
            "frequency": "QUARTERLY",
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
