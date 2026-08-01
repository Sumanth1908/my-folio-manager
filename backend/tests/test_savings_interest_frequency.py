from datetime import datetime, timedelta, timezone

from sqlmodel import select

from app.models import AccountType
from app.models.rule import Rule, RuleType
from app.schemas.account import AccountCreate, AccountUpdate
from app.services.account_service import create_account, update_account


def test_create_savings_account_uses_selected_interest_frequency(session, user):
    account = create_account(
        session,
        AccountCreate(
            account_name="Quarterly Saver",
            account_type=AccountType.SAVINGS,
            is_interest_enabled=True,
            metadata_={
                "interest_rate": 4.5,
                "interest_accrual_day": 1,
                "interest_frequency": "QUARTERLY",
            },
        ),
        user.user_id,
    )

    rule = session.exec(
        select(Rule).where(
            Rule.account_id == account.account_id,
            Rule.rule_type == RuleType.CALCULATION,
        )
    ).one()

    assert rule.name == "Quarterly Interest - Quarterly Saver"
    assert rule.configuration["frequency"] == "QUARTERLY"
    assert rule.is_active is True
    assert rule.next_run_at.month in {1, 4, 7, 10}
    assert rule.next_run_at.day == 1


def test_update_savings_frequency_reschedules_existing_rule(session, user):
    account = create_account(
        session,
        AccountCreate(
            account_name="Flexible Saver",
            account_type=AccountType.SAVINGS,
            is_interest_enabled=True,
            metadata_={"interest_rate": 4.5, "interest_frequency": "MONTHLY"},
        ),
        user.user_id,
    )
    rule = session.exec(select(Rule).where(Rule.account_id == account.account_id)).one()

    updated = update_account(
        session,
        account.account_id,
        AccountUpdate(
            metadata_={"interest_rate": 4.5, "interest_frequency": "DAILY"},
        ),
        user.user_id,
    )

    session.refresh(rule)
    assert updated.metadata_["interest_frequency"] == "DAILY"
    assert rule.name == "Daily Interest - Flexible Saver"
    assert rule.configuration["frequency"] == "DAILY"
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    assert now < rule.next_run_at <= now + timedelta(days=2)
    assert len(session.exec(select(Rule).where(Rule.account_id == account.account_id)).all()) == 1


def test_legacy_savings_accounts_default_to_monthly(session, user):
    account = create_account(
        session,
        AccountCreate(
            account_name="Legacy Saver",
            account_type=AccountType.SAVINGS,
            is_interest_enabled=True,
            metadata_={"interest_rate": 4.5},
        ),
        user.user_id,
    )

    rule = session.exec(select(Rule).where(Rule.account_id == account.account_id)).one()
    assert rule.configuration["frequency"] == "MONTHLY"
