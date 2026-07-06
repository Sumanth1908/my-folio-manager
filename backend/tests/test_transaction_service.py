from decimal import Decimal

import pytest
from sqlmodel import select

from app.models import AccountType, Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransferRequest
from app.services.account_service import calculate_account_balance
from app.services.transaction_service import (create_transaction_core,
                                              create_transfer_core,
                                              delete_transaction,
                                              update_transaction)
from tests.conftest import make_account, seed_transaction


class TestCreateTransaction:
    def test_balance_is_derived_from_transactions(self, session, user):
        account = make_account(session, user)
        create_transaction_core(session, TransactionCreate(account_id=account.account_id, amount=Decimal("100.00")), user.user_id)
        create_transaction_core(session, TransactionCreate(account_id=account.account_id, amount=Decimal("-30.00")), user.user_id)

        assert calculate_account_balance(session, account) == Decimal("70.00")

    def test_closed_account_rejected(self, session, user):
        account = make_account(session, user, status="Closed")
        with pytest.raises(ValueError, match="closed"):
            create_transaction_core(
                session,
                TransactionCreate(account_id=account.account_id, amount=Decimal("100.00")),
                user.user_id,
            )

    def test_currency_is_server_authoritative(self, session, user):
        account = make_account(session, user, currency="INR")
        tx = create_transaction_core(
            session,
            TransactionCreate(account_id=account.account_id, amount=Decimal("100.00"), currency="XYZ"),
            user.user_id,
        )
        assert tx.currency == "INR"

    def test_idempotency_key_prevents_duplicates(self, session, user):
        account = make_account(session, user)
        payload = TransactionCreate(
            account_id=account.account_id, amount=Decimal("100.00"), idempotency_key="retry-123"
        )
        first = create_transaction_core(session, payload, user.user_id)
        second = create_transaction_core(session, payload, user.user_id)

        assert first.transaction_id == second.transaction_id
        all_txs = session.exec(select(Transaction)).all()
        assert len(all_txs) == 1

    def test_zero_amount_rejected_by_schema(self, session, user):
        account = make_account(session, user)
        with pytest.raises(Exception):
            TransactionCreate(account_id=account.account_id, amount=Decimal("0.00"))

    def test_other_users_account_rejected(self, session, user):
        account = make_account(session, user)
        with pytest.raises(ValueError, match="not found or access denied"):
            create_transaction_core(
                session,
                TransactionCreate(account_id=account.account_id, amount=Decimal("10.00")),
                "some-other-user-id",
            )


class TestTransfers:
    def test_transfer_creates_linked_legs(self, session, user):
        a = make_account(session, user, name="A")
        b = make_account(session, user, name="B")
        result = create_transfer_core(
            session,
            TransferRequest(from_account_id=a.account_id, to_account_id=b.account_id, amount=Decimal("250.00")),
            user.user_id,
        )
        assert len(result["transactions"]) == 2
        assert calculate_account_balance(session, a) == Decimal("-250.00")
        assert calculate_account_balance(session, b) == Decimal("250.00")

    def test_zero_transfer_rejected_by_schema(self, session, user):
        a = make_account(session, user)
        b = make_account(session, user)
        with pytest.raises(Exception):
            TransferRequest(from_account_id=a.account_id, to_account_id=b.account_id, amount=Decimal("0"))

    def test_transfer_to_closed_account_rejected(self, session, user):
        a = make_account(session, user)
        b = make_account(session, user, status="Closed")
        with pytest.raises(ValueError, match="closed"):
            create_transfer_core(
                session,
                TransferRequest(from_account_id=a.account_id, to_account_id=b.account_id, amount=Decimal("10")),
                user.user_id,
            )

    def test_deleting_one_leg_removes_both(self, session, user):
        a = make_account(session, user)
        b = make_account(session, user)
        create_transfer_core(
            session,
            TransferRequest(from_account_id=a.account_id, to_account_id=b.account_id, amount=Decimal("100")),
            user.user_id,
        )
        leg = session.exec(select(Transaction)).first()
        assert delete_transaction(session, leg.transaction_id, user.user_id) is True
        assert session.exec(select(Transaction)).all() == []


class TestUpdateTransaction:
    def test_full_edit(self, session, user):
        account = make_account(session, user)
        tx = seed_transaction(session, account, 100, description="typo")
        updated = update_transaction(
            session, tx.transaction_id, user.user_id,
            TransactionUpdate(amount=Decimal("120.00"), description="fixed"),
        )
        assert updated.amount == Decimal("120.00")
        assert updated.description == "fixed"

    def test_transfer_leg_amount_edit_rejected(self, session, user):
        a = make_account(session, user)
        b = make_account(session, user)
        create_transfer_core(
            session,
            TransferRequest(from_account_id=a.account_id, to_account_id=b.account_id, amount=Decimal("100")),
            user.user_id,
        )
        leg = session.exec(select(Transaction)).first()
        with pytest.raises(ValueError, match="transfer"):
            update_transaction(session, leg.transaction_id, user.user_id, TransactionUpdate(amount=Decimal("999.00")))


class TestLoanBalances:
    def test_loan_balance_includes_base(self, session, user):
        loan = make_account(session, user, account_type=AccountType.LOAN, metadata={"loan_amount": "10000"})
        assert calculate_account_balance(session, loan) == Decimal("-10000")

        create_transaction_core(session, TransactionCreate(account_id=loan.account_id, amount=Decimal("2000.00")), user.user_id)
        assert calculate_account_balance(session, loan) == Decimal("-8000.00")

    def test_loan_recalc_splits_interest_and_principal(self, session, user):
        loan = make_account(session, user, account_type=AccountType.LOAN, metadata={"loan_amount": "10000"})
        # Interest accrual (debit), then a payment covering interest first
        create_transaction_core(session, TransactionCreate(account_id=loan.account_id, amount=Decimal("-100.00"), description="interest"), user.user_id)
        create_transaction_core(session, TransactionCreate(account_id=loan.account_id, amount=Decimal("600.00"), description="payment"), user.user_id)

        session.refresh(loan)
        assert loan.metadata_["interest_balance"] == 0.0
        assert loan.metadata_["principal_balance"] == 9500.0
        assert loan.metadata_["outstanding_amount"] == 9500.0
