from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.models.user import User
from app.schemas.transaction import (TransactionCreate, TransactionRead,
                                     TransferRequest)
from app.schemas.common import PaginatedResponse
from app.services import transaction_service
from app.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionRead)
def create_transaction(
    transaction_in: TransactionCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction."""
    try:
        transaction = transaction_service.create_transaction_core(session, transaction_in, current_user.user_id)
        return transaction_service.enrich_transaction(session, transaction)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create transaction: {str(e)}")


@router.post("/transfer/")
def create_transfer(
    transfer: TransferRequest, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a transfer between two accounts."""
    try:
        return transaction_service.create_transfer_core(session, transfer, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Transfer failed: {str(e)}")


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
    """Get all transactions for current user, optionally filtered."""
    transactions, total = transaction_service.get_transactions(
        session, current_user.user_id, skip, limit, account_id, search, category_id, start_date, end_date
    )
    
    items = [transaction_service.enrich_transaction(session, tx) for tx in transactions]
    
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )





@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a transaction."""
    success = transaction_service.delete_transaction(session, transaction_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    return {"ok": True}
