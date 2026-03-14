import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlmodel import Session, func, select

from app.models import (Account, Transaction, TransactionType, AccountType)
from app.models.loan_account import LoanAccount
from app.models.category import Category
from app.models.rule import Rule
from app.schemas.transaction import (TransactionCreate, TransactionRead,
                                     TransferRequest)
import uuid

logger = logging.getLogger(__name__)


def enrich_transaction(session: Session, transaction: Transaction) -> TransactionRead:
    """Helper to attach category details to transaction response."""
    tx_dict = transaction.model_dump()
    if transaction.category_id:
        category = session.get(Category, transaction.category_id)
        if category:
            tx_dict['category'] = category
    return TransactionRead.model_validate(tx_dict)


def get_transaction_with_ownership(session: Session, transaction_id: int, user_id: str) -> Optional[Transaction]:
    """Fetch a transaction and verify it belongs to one of the user's accounts."""
    result = session.exec(
        select(Transaction)
        .join(Account)
        .where(Transaction.transaction_id == transaction_id)
        .where(Account.user_id == user_id)
    ).first()
    return result


def get_transactions(
    session: Session, 
    user_id: str, 
    skip: int = 0, 
    limit: int = 100,
    account_id: Optional[str] = None,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Tuple[List[Transaction], int]:
    """Search and filter transactions for a user."""
    base_query = select(Transaction).join(Account).where(Account.user_id == user_id)
    
    if account_id:
        base_query = base_query.where(Transaction.account_id == account_id)
        
    if search:
        base_query = base_query.where(Transaction.description.ilike(f"%{search}%"))
        
    if category_id:
        base_query = base_query.where(Transaction.category_id == category_id)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if start_dt.tzinfo:
                start_dt = start_dt.astimezone(timezone.utc).replace(tzinfo=None)
            base_query = base_query.where(Transaction.transaction_date >= start_dt)
        except ValueError:
            base_query = base_query.where(Transaction.transaction_date >= start_date)

    if end_date:
        try:
            if 'T' in end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            else:
                end_dt = datetime.fromisoformat(end_date)
                end_dt = end_dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            if end_dt.tzinfo:
                end_dt = end_dt.astimezone(timezone.utc).replace(tzinfo=None)
            base_query = base_query.where(Transaction.transaction_date <= end_dt)
        except ValueError:
            base_query = base_query.where(Transaction.transaction_date <= end_date)
    
    # Count total
    count_query = select(func.count()).select_from(base_query.subquery())
    total = session.exec(count_query).one()
    
    # Apply pagination
    query = base_query.offset(skip).limit(limit).order_by(Transaction.transaction_date.desc())
    transactions = session.exec(query).all()
    
    return transactions, total


def recalculate_loan_balances(session: Session, account_id: str):
    """
    Sequentially recalculates the principal and interest balances for a loan.
    Logic:
    - Payments (CREDITS) settle Interest first, then Principal.
    - Accruals (DEBITS) increase the Interest balance.
    """
    loan = session.get(LoanAccount, account_id)
    if not loan:
        return
        
    # Reset to starting state
    loan.principal_balance = loan.loan_amount
    loan.interest_balance = Decimal("0.00")
    
    # Get all transactions chronologically
    transactions = session.exec(
        select(Transaction)
        .where(Transaction.account_id == account_id)
        .order_by(Transaction.transaction_date.asc(), Transaction.transaction_id.asc())
    ).all()
    
    for tx in transactions:
        if tx.transaction_type == TransactionType.DEBIT:
            # Interest increase
            loan.interest_balance += tx.amount
        else:
            # Payment (Credit)
            interest_payment = min(tx.amount, loan.interest_balance)
            principal_payment = tx.amount - interest_payment
            
            loan.interest_balance -= interest_payment
            loan.principal_balance -= principal_payment
            
    loan.outstanding_amount = loan.principal_balance + loan.interest_balance
    session.add(loan)

def create_transaction_core(session: Session, transaction_in: TransactionCreate, user_id: str) -> Transaction:
    """
    Core logic for creating a transaction.
    Handles: Ownership validation, Defaults, Auto-Categorization, Loan balancing.
    """
    account = session.get(Account, transaction_in.account_id)
    if not account or account.user_id != user_id:
        raise ValueError("Account not found or access denied")
    
    transaction_data = transaction_in.model_dump(exclude_unset=True)
    if not transaction_data.get("currency"):
        transaction_data["currency"] = account.currency
    
    if not transaction_data.get('transaction_date'):
        transaction_data['transaction_date'] = datetime.now(timezone.utc).replace(tzinfo=None)
        
    transaction = Transaction.model_validate(transaction_data)
    
    # Apply Auto-Categorization Rules
    if not transaction.category_id and transaction.description:
        rules = session.exec(
            select(Rule).where(
                Rule.account_id == transaction.account_id,
                Rule.is_active == True
            )
        ).all()
        
        for rule in rules:
            if rule.description_contains and rule.description_contains.lower() in transaction.description.lower():
                transaction.category_id = rule.category_id
                break
                
    session.add(transaction)
    session.flush() # Ensure ID is generated for recalculation if needed
    
    # Update Loan Balances if applicable
    if account.account_type == AccountType.LOAN:
        recalculate_loan_balances(session, account.account_id)
        
    session.commit()
    session.refresh(transaction)
    
    return transaction




def create_transfer_core(session: Session, transfer: TransferRequest, user_id: str) -> dict:
    """
    Core logic for creating a transfer.
    Handles: Ownership validation, Debit/Credit creation.
    """
    if transfer.from_account_id == transfer.to_account_id:
        raise ValueError("Cannot transfer to the same account")

    from_account = session.get(Account, transfer.from_account_id)
    to_account = session.get(Account, transfer.to_account_id)

    if not from_account or from_account.user_id != user_id:
        raise ValueError("Source account not found or access denied")
    if not to_account or to_account.user_id != user_id:
        raise ValueError("Target account not found or access denied")
    
    transfer_date = transfer.transaction_date or datetime.now(timezone.utc).replace(tzinfo=None)
    desc = transfer.description or f"Transfer to {to_account.account_name}"

    transfer_id = str(uuid.uuid4())

    # Create Debit from source
    debit_tx = Transaction(
        account_id=transfer.from_account_id,
        amount=transfer.amount,
        transaction_type=TransactionType.DEBIT,
        currency=from_account.currency,
        description=f"Transfer to {to_account.account_name}: {desc}",
        additional_info=transfer.additional_info,
        category_id=transfer.category_id,
        transfer_id=transfer_id,
        transaction_date=transfer_date
    )

    # Create Credit to destination
    credit_amount = transfer.to_amount if transfer.to_amount is not None else transfer.amount
    
    credit_tx = Transaction(
        account_id=transfer.to_account_id,
        amount=credit_amount,
        transaction_type=TransactionType.CREDIT,
        currency=to_account.currency,
        description=f"Transfer from {from_account.account_name}: {desc}",
        additional_info=transfer.additional_info,
        category_id=transfer.category_id,
        transfer_id=transfer_id,
        transaction_date=transfer_date
    )

    session.add(debit_tx)
    session.add(credit_tx)
    session.flush()
    
    # Update Loan Balances for both accounts if applicable
    if from_account.account_type == AccountType.LOAN:
        recalculate_loan_balances(session, from_account.account_id)
    if to_account.account_type == AccountType.LOAN:
        recalculate_loan_balances(session, to_account.account_id)
        
    session.commit()
    
    return {"message": "Transfer successful"}





def delete_transaction(session: Session, transaction_id: int, user_id: str) -> bool:
    """Delete a transaction if it belongs to the user. If part of a transfer, deletes both legs."""
    transaction = get_transaction_with_ownership(session, transaction_id, user_id)
    if not transaction:
        return False
        
    account_id = transaction.account_id
    transfer_id = transaction.transfer_id
    
    # If this is part of a transfer, find and delete the other leg
    if transfer_id:
        related_txs = session.exec(
            select(Transaction).where(
                Transaction.transfer_id == transfer_id,
                Transaction.transaction_id != transaction_id
            )
        ).all()
        for related_tx in related_txs:
            # Check if related leg is also a loan
            rel_account = session.get(Account, related_tx.account_id)
            session.delete(related_tx)
            if rel_account and rel_account.account_type == AccountType.LOAN:
                session.flush()
                recalculate_loan_balances(session, rel_account.account_id)

    session.delete(transaction)
    session.flush()
    
    # Update loan balances for the primary account
    account = session.get(Account, account_id)
    if account and account.account_type == AccountType.LOAN:
        recalculate_loan_balances(session, account_id)

    session.commit()
    return True
