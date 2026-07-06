from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

# Import all models so SQLModel.metadata is fully populated
from app import models  # noqa: F401
from app.models import Account, AccountType, Transaction, User


@pytest.fixture
def engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    return engine


@pytest.fixture
def session(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture
def user(session):
    user = User(email="test@example.com", password_hash="x", full_name="Test User")
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def make_account(session, user, account_type=AccountType.SAVINGS, currency="USD", status="Active", metadata=None, name="Test Account"):
    account = Account(
        user_id=user.user_id,
        account_type=account_type,
        account_name=name,
        currency=currency,
        status=status,
        metadata_=metadata,
    )
    session.add(account)
    session.commit()
    session.refresh(account)
    return account


def seed_transaction(session, account, amount, days_ago=0, description="seed"):
    tx = Transaction(
        account_id=account.account_id,
        amount=Decimal(str(amount)),
        currency=account.currency,
        description=description,
        transaction_date=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days_ago),
    )
    session.add(tx)
    session.commit()
    session.refresh(tx)
    return tx
