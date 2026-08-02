from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.models.user import User
from app.schemas.account import (
    AccountCloseRequest,
    AccountCreate,
    AccountRead,
    AccountTypeRead,
    AccountUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services import account_service
from app.services.account_types import list_account_type_definitions
from app.services import interest_service, rules_service
from app.schemas.interest import (
    InterestExecutionRead,
    InterestPolicyRead,
    InterestPolicyUpdate,
    InterestPreview,
    InterestPreviewRequest,
)
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
    asset_values = account_service.get_asset_values_for_accounts(session, accounts)
    policies = interest_service.get_interest_policies_for_accounts(
        session, [account.account_id for account in accounts]
    )
    items = [
        account_service.enrich_account(
            session,
            account,
            balance=balances.get(account.account_id),
            asset_value=asset_values.get(account.account_id, Decimal("0.00")),
            interest_policy=policies.get(account.account_id),
            interest_policy_loaded=True,
        )
        for account in accounts
    ]

    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/types", response_model=List[AccountTypeRead])
def read_account_types():
    """Return built-in account types and their capabilities for UI clients."""
    return list_account_type_definitions()


@router.post("/interest-preview", response_model=InterestPreview)
def preview_interest(payload: InterestPreviewRequest):
    """Preview product terms with the same calculator used by settlement."""
    return interest_service.preview_interest(payload)


@router.get("/{account_id}/interest-policy", response_model=InterestPolicyRead)
def read_interest_policy(
    account_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    account = account_service.get_account_with_ownership(session, account_id, current_user.user_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    policy = interest_service.get_interest_policy(session, account_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Interest policy not found")
    return policy


@router.put("/{account_id}/interest-policy", response_model=InterestPolicyRead)
def update_interest_policy(
    account_id: str,
    payload: InterestPolicyUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    account = account_service.get_account_with_ownership(session, account_id, current_user.user_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    try:
        policy = interest_service.update_interest_policy(session, account, payload)
        rules_service.upsert_managed_interest_rule(session, account, policy)
        session.commit()
        session.refresh(policy)
        return policy
    except ValueError as exc:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{account_id}/interest-executions", response_model=List[InterestExecutionRead])
def read_interest_executions(
    account_id: str,
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    executions = interest_service.get_interest_executions(
        session, account_id, current_user.user_id, limit
    )
    if executions is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return executions


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
    try:
        account = account_service.update_account(session, account_id, account_in, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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
