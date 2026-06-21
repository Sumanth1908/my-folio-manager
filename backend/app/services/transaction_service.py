import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlmodel import Session, func, select

from app.models import (Account, Transaction, AccountType)
from app.models.category import Category
from app.models.rule import Rule
from app.schemas.transaction import (TransactionCreate, TransactionRead,
                                     TransferRequest, TransactionUpdate)
import uuid

logger = logging.getLogger(__name__)

def enrich_transaction(session: Session, transaction: Transaction) -> TransactionRead:
    tx_dict = transaction.model_dump()
    if transaction.category_id:
        category = session.get(Category, transaction.category_id)
        if category:
            tx_dict['category'] = category
    return TransactionRead.model_validate(tx_dict)

def get_transaction_with_ownership(session: Session, transaction_id: int, user_id: str) -> Optional[Transaction]:
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
    
    count_query = select(func.count()).select_from(base_query.subquery())
    total = session.exec(count_query).one()
    
    query = base_query.offset(skip).limit(limit).order_by(Transaction.transaction_date.desc())
    transactions = session.exec(query).all()
    
    return transactions, total

def recalculate_loan_balances(session: Session, account_id: str):
    account = session.get(Account, account_id)
    if not account or account.account_type != AccountType.LOAN:
        return
        
    metadata_ = account.metadata_ or {}
    loan_amount = Decimal(str(metadata_.get("loan_amount", "0.00")))
    
    principal_balance = loan_amount
    interest_balance = Decimal("0.00")
    
    transactions = session.exec(
        select(Transaction)
        .where(Transaction.account_id == account_id)
        .order_by(Transaction.transaction_date.asc(), Transaction.transaction_id.asc())
    ).all()
    
    for tx in transactions:
        if tx.amount < 0:
            # Debit: Accrual of interest or fee (negative amount represents liability increase here for loans, wait actually loan balances are complicated, 
            # traditionally loan debits increase debt and credits decrease debt.
            # Assuming negative amount means debit (increase debt)
            interest_balance += abs(tx.amount)
        else:
            # Credit: Payment (positive amount decreases debt)
            interest_payment = min(tx.amount, interest_balance)
            principal_payment = tx.amount - interest_payment
            
            interest_balance -= interest_payment
            principal_balance -= principal_payment
            
    metadata_["principal_balance"] = float(principal_balance)
    metadata_["interest_balance"] = float(interest_balance)
    metadata_["outstanding_amount"] = float(principal_balance + interest_balance)
    
    account.metadata_ = metadata_
    session.add(account)

def create_transaction_core(session: Session, transaction_in: TransactionCreate, user_id: str) -> Transaction:
    account = session.get(Account, transaction_in.account_id)
    if not account or account.user_id != user_id:
        raise ValueError("Account not found or access denied")
    
    transaction_data = transaction_in.model_dump(exclude_unset=True)
    if not transaction_data.get("currency"):
        transaction_data["currency"] = account.currency
    
    if not transaction_data.get('transaction_date'):
        transaction_data['transaction_date'] = datetime.now(timezone.utc).replace(tzinfo=None)
        
    transaction = Transaction.model_validate(transaction_data)
    
    if not transaction.category_id and transaction.description:
        rules = session.exec(
            select(Rule).where(
                Rule.account_id == transaction.account_id,
                Rule.is_active == True
            )
        ).all()
        
        for rule in rules:
            config = rule.configuration or {}
            description_contains = config.get("description_contains")
            category_id = config.get("category_id")
            if description_contains and category_id and description_contains.lower() in transaction.description.lower():
                transaction.category_id = category_id
                break
                
    session.add(transaction)
    session.flush() 
    
    if account.account_type == AccountType.LOAN:
        recalculate_loan_balances(session, account.account_id)
        
    session.commit()
    session.refresh(transaction)
    
    return transaction


def create_transfer_core(session: Session, transfer: TransferRequest, user_id: str) -> dict:
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

    debit_tx = Transaction(
        account_id=transfer.from_account_id,
        amount=-abs(transfer.amount),
        currency=from_account.currency,
        description=f"Transfer to {to_account.account_name}: {desc}",
        additional_info=transfer.additional_info,
        category_id=transfer.category_id,
        transfer_id=transfer_id,
        transaction_date=transfer_date
    )

    credit_amount = transfer.to_amount if transfer.to_amount is not None else transfer.amount
    
    credit_tx = Transaction(
        account_id=transfer.to_account_id,
        amount=abs(credit_amount),
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
    
    if from_account.account_type == AccountType.LOAN:
        recalculate_loan_balances(session, from_account.account_id)
    if to_account.account_type == AccountType.LOAN:
        recalculate_loan_balances(session, to_account.account_id)
        
    session.commit()
    
    return {"message": "Transfer successful"}

def update_transaction(session: Session, transaction_id: int, user_id: str, update_data: TransactionUpdate) -> Optional[Transaction]:
    transaction = get_transaction_with_ownership(session, transaction_id, user_id)
    if not transaction:
        return None
        
    # Update category logic
    if update_data.category_id is not None or hasattr(update_data, 'category_id'): # hasattr check to allow explicit nulls if needed, wait pydantic models always have it.
        # Actually in BaseModel, if it's unset we shouldn't update, but we only have category_id so it's fine
        category_id = update_data.category_id
        
        # If it's a transfer, update all related transfer transactions
        if transaction.transfer_id:
            related_txs = session.exec(
                select(Transaction).where(Transaction.transfer_id == transaction.transfer_id)
            ).all()
            for tx in related_txs:
                tx.category_id = category_id
                session.add(tx)
        else:
            transaction.category_id = category_id
            session.add(transaction)
            
        session.commit()
        session.refresh(transaction)
        
    return transaction


def delete_transaction(session: Session, transaction_id: int, user_id: str) -> bool:
    transaction = get_transaction_with_ownership(session, transaction_id, user_id)
    if not transaction:
        return False
        
    account_id = transaction.account_id
    transfer_id = transaction.transfer_id
    
    if transfer_id:
        related_txs = session.exec(
            select(Transaction).where(
                Transaction.transfer_id == transfer_id,
                Transaction.transaction_id != transaction_id
            )
        ).all()
        for related_tx in related_txs:
            rel_account = session.get(Account, related_tx.account_id)
            session.delete(related_tx)
            if rel_account and rel_account.account_type == AccountType.LOAN:
                session.flush()
                recalculate_loan_balances(session, rel_account.account_id)

    session.delete(transaction)
    session.flush()
    
    account = session.get(Account, account_id)
    if account and account.account_type == AccountType.LOAN:
        recalculate_loan_balances(session, account_id)

    session.commit()
    return True
