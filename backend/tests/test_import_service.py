from decimal import Decimal

import pytest
from sqlmodel import select

from app.models import Transaction
from app.services.import_service import import_transactions_csv
from tests.conftest import make_account

CSV = b"""date,description,amount
2026-01-05,Grocery Store,-45.20
2026-01-06,Salary,2500.00
2026-01-07,Coffee,(4.50)
"""


def test_csv_import_basic(session, user):
    account = make_account(session, user)
    result = import_transactions_csv(session, user.user_id, account.account_id, CSV)

    assert result["imported"] == 3
    assert result["skipped_duplicates"] == 0
    txs = session.exec(select(Transaction)).all()
    amounts = sorted(t.amount for t in txs)
    assert amounts == [Decimal("-45.20"), Decimal("-4.50"), Decimal("2500.00")]


def test_csv_reimport_skips_duplicates(session, user):
    account = make_account(session, user)
    import_transactions_csv(session, user.user_id, account.account_id, CSV)
    result = import_transactions_csv(session, user.user_id, account.account_id, CSV)

    assert result["imported"] == 0
    assert result["skipped_duplicates"] == 3
    assert len(session.exec(select(Transaction)).all()) == 3


def test_csv_missing_column_rejected(session, user):
    account = make_account(session, user)
    with pytest.raises(ValueError, match="not found in CSV"):
        import_transactions_csv(
            session, user.user_id, account.account_id, CSV, amount_column="value"
        )


def test_csv_closed_account_rejected(session, user):
    account = make_account(session, user, status="Closed")
    with pytest.raises(ValueError, match="closed"):
        import_transactions_csv(session, user.user_id, account.account_id, CSV)


def test_csv_bad_rows_reported(session, user):
    account = make_account(session, user)
    csv_with_junk = b"""date,description,amount
2026-01-05,Valid,-10.00
not-a-date,Broken,abc
"""
    result = import_transactions_csv(session, user.user_id, account.account_id, csv_with_junk)
    assert result["imported"] == 1
    assert result["error_count"] == 1
