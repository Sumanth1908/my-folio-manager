from typing import List, Optional

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
        # Create Transaction directly
        transaction_data = transaction_in.model_dump()
        db_transaction = Transaction.model_validate(transaction_data)
        
        session.add(db_transaction)
        session.commit()
        session.refresh(db_transaction)
        transaction = db_transaction
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
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
        
        # Debit
        debit_tx = Transaction(
            account_id=source.account_id,
            amount=transfer.amount,
            transaction_type=TransactionType.DEBIT,
            currency=source.currency,
            description=f"Transfer to {target.account_name}: {desc}",
            transaction_date=transfer.date
        )
        
        # Credit
        credit_tx = Transaction(
            account_id=target.account_id,
            amount=transfer.amount,
            transaction_type=TransactionType.CREDIT,
            currency=target.currency,
            description=f"Transfer from {source.account_name}: {desc}",
            transaction_date=transfer.date
        )
        
        session.add(debit_tx)
        session.add(credit_tx)
        session.commit()
        
        return {"message": "Transfer successful"}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



from app.schemas.common import PaginatedResponse
from sqlmodel import func

@router.get("/", response_model=PaginatedResponse[TransactionRead])
def read_transactions(
    skip: int = 0,
    limit: int = 100,
    account_id: Optional[str] = None,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all transactions for current user, optionally filtered by account, search, and category."""
    
    # Base query joined with Account to filter by user_id
    base_query = select(Transaction).join(Account).where(Account.user_id == current_user.user_id)
    
    if account_id:
        base_query = base_query.where(Transaction.account_id == account_id)
        
    if search:
        base_query = base_query.where(Transaction.description.ilike(f"%{search}%"))
        
    if category_id:
        base_query = base_query.where(Transaction.category_id == category_id)
    
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
