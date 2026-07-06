from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.models.user import User
from app.schemas.account import AccountCloseRequest, AccountCreate, AccountRead, AccountUpdate
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
    try:
        account = account_service.create_account(session, account_in, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return account_service.enrich_account(session, account)


@router.get("/", response_model=PaginatedResponse[AccountRead])
def read_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all accounts for the current user."""
    accounts, total = account_service.get_accounts(session, current_user.user_id, skip, limit)

    balances = account_service.get_balances_for_accounts(session, accounts)
    items = [
        account_service.enrich_account(session, account, balance=balances.get(account.account_id))
        for account in accounts
    ]

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


@router.post("/{account_id}/close", response_model=AccountRead)
def close_account(
    account_id: str,
    payload: Optional[AccountCloseRequest] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Close an account (e.g. a loan) and deactivate its automation rules.

    If the account has an outstanding balance, it is settled first — either via a
    transfer from `source_account_id`, or as a standalone transaction if no source
    is given (e.g. paid off in cash)."""
    source_account_id = payload.source_account_id if payload else None
    try:
        account = account_service.close_account(session, account_id, current_user.user_id, source_account_id)
    except ValueError as e:
        status_code = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(e))

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
