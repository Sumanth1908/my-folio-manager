from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models import (Account, AccountType, LoanAccount, Transaction,
                        TransactionType)
from app.models.category import Category
from app.models.rule import Rule
from app.schemas.transaction import TransactionCreate, TransferRequest


def create_transaction_core(session: Session, transaction_in: TransactionCreate) -> Transaction:
    """
    Core logic for creating a transaction.
    Handles: Validation, Defaults, Auto-Categorization, Loan Updates.
    """
    # Verify account exists
    account = session.get(Account, transaction_in.account_id)
    if not account:
        raise ValueError("Account not found")
    
    # Set currency from account if not provided
    transaction_data = transaction_in.model_dump(exclude_unset=True)
    if not transaction_data.get("currency"):
        transaction_data["currency"] = account.currency
        
    transaction = Transaction.model_validate(transaction_data)
    
    # Apply Auto-Categorization Rules if no category provided
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
    
    # NOTE: We no longer update LoanAccount.outstanding_amount here.
    # The balance is calculated dynamically in AccountService based on transactions.
    
    session.commit()
    session.refresh(transaction)
    
    return transaction

def create_transfer_core(session: Session, transfer: TransferRequest) -> dict:
    """
    Core logic for creating a transfer.
    Handles: Validation, Debit/Credit creation, Loan Updates.
    """
    from_account = session.get(Account, transfer.from_account_id)
    to_account = session.get(Account, transfer.to_account_id)

    if not from_account or not to_account:
        raise ValueError("One or both accounts not found")
    
    # Create Debit from source
    debit_tx = Transaction(
        account_id=transfer.from_account_id,
        amount=transfer.amount,
        transaction_type=TransactionType.DEBIT,
        currency=from_account.currency,
        description=f"Transfer to {to_account.account_name or 'Account'}: {transfer.description or ''}",
        category_id=transfer.category_id,
        transaction_date=datetime.now()
    )

    # Create Credit to destination
    credit_tx = Transaction(
        account_id=transfer.to_account_id,
        amount=transfer.amount,
        transaction_type=TransactionType.CREDIT,
        currency=to_account.currency,
        description=f"Transfer from {from_account.account_name or 'Account'}: {transfer.description or ''}",
        category_id=transfer.category_id,
        transaction_date=datetime.now()
    )

    session.add(debit_tx)
    session.add(credit_tx)
    
    # NOTE: We no longer update LoanAccount.outstanding_amount here.
    # The balance is calculated dynamically in AccountService based on transactions.
    
    session.commit()
    
    return {"message": "Transfer successful"}
