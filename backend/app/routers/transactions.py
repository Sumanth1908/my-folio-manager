from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, SQLModel, select

from app.core.database import get_session
from app.models import Account, Transaction, TransactionType
from app.models.category import Category
from app.models.user import User
from app.schemas.transaction import (TransactionCreate, TransactionRead,
                                     TransactionUpdate, TransferRequest)
from app.services.transaction_service import (create_transaction_core,
                                              create_transfer_core)
from app.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionRead)
def create_transaction(
    transaction_in: TransactionCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction."""
    
    # Validate account belongs to user
    account = session.get(Account, transaction_in.account_id)
    if not account or account.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Account not found")

    try:
        # Create Transaction
        transaction_data = transaction_in.model_dump(exclude_unset=True)
        
        # Ensure currency is set from account if not provided
        if not transaction_data.get('currency'):
            transaction_data['currency'] = account.currency
            
        # Ensure date is set if not provided
        if not transaction_data.get('transaction_date'):
            transaction_data['transaction_date'] = datetime.now(timezone.utc).replace(tzinfo=None)
            
        db_transaction = Transaction(**transaction_data)
        
        session.add(db_transaction)
        session.commit()
        session.refresh(db_transaction)
        transaction = db_transaction
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create transaction: {str(e)}")
        
    # Load category if present (for response model)
    tx_dict = transaction.model_dump()
    if transaction.category_id:
        category = session.get(Category, transaction.category_id)
        if category:
            tx_dict['category'] = category
    
    return TransactionRead.model_validate(tx_dict)


@router.post("/transfer/")
def create_transfer(
    transfer: TransferRequest, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a transfer between two accounts."""
    
    # Validate both accounts belong to user
    source = session.get(Account, transfer.from_account_id)
    target = session.get(Account, transfer.to_account_id)
    
    if transfer.from_account_id == transfer.to_account_id:
        raise HTTPException(status_code=400, detail="Cannot transfer to the same account")
    
    if not source or source.user_id != current_user.user_id:
         raise HTTPException(status_code=404, detail="Source account not found")
    if not target or target.user_id != current_user.user_id:
         raise HTTPException(status_code=404, detail="Target account not found")
    
    # Logic: Debit Source, Credit Target.
    try:
        if source.currency != target.currency:
            # Simple conversion not implemented in this snippet
            pass
            
        desc = transfer.description or f"Transfer to {target.account_name}"
        transfer_date = transfer.transaction_date or datetime.utcnow()
        
        # Debit
        debit_tx = Transaction(
            account_id=source.account_id,
            amount=transfer.amount,
            transaction_type=TransactionType.DEBIT,
            currency=source.currency,
            description=f"Transfer to {target.account_name}: {desc}",
            transaction_date=transfer_date
        )
        
        # Credit
        credit_tx = Transaction(
            account_id=target.account_id,
            amount=transfer.amount,
            transaction_type=TransactionType.CREDIT,
            currency=target.currency,
            description=f"Transfer from {source.account_name}: {desc}",
            transaction_date=transfer_date
        )
        
        session.add(debit_tx)
        session.add(credit_tx)
        session.commit()
        
        return {"message": "Transfer successful"}
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Transfer failed: {str(e)}")



from app.schemas.common import PaginatedResponse
from sqlmodel import func

@router.get("/", response_model=PaginatedResponse[TransactionRead])
def read_transactions(
    skip: int = 0,
    limit: int = 100,
    account_id: Optional[str] = None,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all transactions for current user, optionally filtered by account, search, category, and date range."""
    
    # Base query joined with Account to filter by user_id
    base_query = select(Transaction).join(Account).where(Account.user_id == current_user.user_id)
    
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
            # Fallback for plain YYYY-MM-DD strings
            base_query = base_query.where(Transaction.transaction_date >= start_date)

    if end_date:
        try:
            # If it's a timestamp, parse it; if just a date, make it end of day
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
    
    # Manually load categories for each transaction
    items = []
    for tx in transactions:
        tx_dict = tx.model_dump()
        if tx.category_id:
            category = session.get(Category, tx.category_id)
            if category:
                tx_dict['category'] = category
        items.append(TransactionRead.model_validate(tx_dict))
    
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.put("/{transaction_id}", response_model=TransactionRead)
@router.patch("/{transaction_id}", response_model=TransactionRead)
def update_transaction(
    transaction_id: int, 
    transaction_update: TransactionUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a transaction."""
    # Join with Account to verify ownership
    result = session.exec(
        select(Transaction, Account)
        .join(Account)
        .where(Transaction.transaction_id == transaction_id)
        .where(Account.user_id == current_user.user_id)
    ).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db_transaction, _ = result
    
    transaction_data = transaction_update.model_dump(exclude_unset=True)
    for key, value in transaction_data.items():
        if key != "id":
            setattr(db_transaction, key, value)
             
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    
    # Load category if present
    tx_dict = db_transaction.model_dump()
    if db_transaction.category_id:
        category = session.get(Category, db_transaction.category_id)
        if category:
            tx_dict['category'] = category
            
    return TransactionRead.model_validate(tx_dict)


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a transaction."""
    # Join with Account to verify ownership
    result = session.exec(
        select(Transaction)
        .join(Account)
        .where(Transaction.transaction_id == transaction_id)
        .where(Account.user_id == current_user.user_id)
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    session.delete(result)
    session.commit()
    return {"ok": True}
