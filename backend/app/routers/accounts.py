from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.models.user import User
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate
from app.schemas.common import PaginatedResponse
from app.services import account_service
from app.deps import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("/", response_model=AccountRead)
def create_account(
    account_in: AccountCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new account with specific details."""
    account = account_service.create_account(session, account_in, current_user.user_id)
    return account_service.enrich_account(session, account)


@router.get("/", response_model=PaginatedResponse[AccountRead])
def read_accounts(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all accounts for the current user."""
    accounts, total = account_service.get_accounts(session, current_user.user_id, skip, limit)
    
    items = [account_service.enrich_account(session, account) for account in accounts]
    
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{account_id}", response_model=AccountRead)
def read_account(
    account_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific account with details."""
    account = account_service.get_account_with_ownership(session, account_id, current_user.user_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    return account_service.enrich_account(session, account)


@router.put("/{account_id}", response_model=AccountRead)
@router.patch("/{account_id}", response_model=AccountRead)
def update_account(
    account_id: str,
    account_in: AccountUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update an account and its specific details."""
    account = account_service.update_account(session, account_id, account_in, current_user.user_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    return account_service.enrich_account(session, account)


@router.delete("/{account_id}")
def delete_account(
    account_id: str, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an account and all its associated transactions."""
    success = account_service.delete_account(session, account_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Account not found")
        
    return {"message": "Account deleted successfully"}
