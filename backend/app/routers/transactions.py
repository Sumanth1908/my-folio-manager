from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlmodel import Session

from app.core.database import get_session
from app.models.user import User
from app.schemas.transaction import (TransactionCreate, TransactionRead,
                                     TransferRequest, TransactionUpdate)
from app.schemas.common import PaginatedResponse
from app.services import transaction_service
from app.services.import_service import import_transactions_csv
from app.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _parse_date_param(value: Optional[str], name: str, end_of_day: bool = False) -> Optional[datetime]:
    """Parse an ISO date/datetime query param; 422 on garbage instead of a
    silent string comparison against the datetime column."""
    if not value:
        return None
    try:
        if 'T' in value:
            parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
        else:
            parsed = datetime.fromisoformat(value)
            if end_of_day:
                parsed = parsed.replace(hour=23, minute=59, second=59, microsecond=999999)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid {name}: '{value}' is not an ISO date")

    if parsed.tzinfo:
        from datetime import timezone
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


@router.post("/", response_model=TransactionRead)
def create_transaction(
    transaction_in: TransactionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new transaction. Safe to retry with the same idempotency_key."""
    try:
        transaction = transaction_service.create_transaction_core(session, transaction_in, current_user.user_id)
    except ValueError as e:
        status_code = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(e))
    return transaction_service.enrich_transaction(session, transaction)


@router.post("/transfer/")
def create_transfer(
    transfer: TransferRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a transfer between two accounts. Returns the created transactions."""
    try:
        return transaction_service.create_transfer_core(session, transfer, current_user.user_id)
    except ValueError as e:
        status_code = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(e))


@router.get("/", response_model=PaginatedResponse[TransactionRead])
def read_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    account_id: Optional[str] = None,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all transactions for current user, optionally filtered."""
    start_dt = _parse_date_param(start_date, "start_date")
    end_dt = _parse_date_param(end_date, "end_date", end_of_day=True)

    transactions, total = transaction_service.get_transactions(
        session, current_user.user_id, skip, limit, account_id, search, category_id, start_dt, end_dt
    )

    items = [transaction_service.enrich_transaction(session, tx) for tx in transactions]

    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )

@router.patch("/{transaction_id}", response_model=TransactionRead)
def update_transaction(
    transaction_id: int,
    transaction_in: TransactionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a transaction (amount, description, date, category)."""
    try:
        transaction = transaction_service.update_transaction(session, transaction_id, current_user.user_id, transaction_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return transaction_service.enrich_transaction(session, transaction)


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


@router.post("/import")
async def import_transactions(
    account_id: str = Form(...),
    file: UploadFile = File(...),
    date_column: str = Form("date"),
    description_column: str = Form("description"),
    amount_column: str = Form("amount"),
    date_format: Optional[str] = Form(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Import transactions from a bank-statement CSV.

    Rows already present (same account, date, amount, description) are
    skipped, so re-importing an overlapping statement is safe. Categorization
    rules are applied to imported rows.
    """
    content = await file.read()
    try:
        result = import_transactions_csv(
            session,
            user_id=current_user.user_id,
            account_id=account_id,
            content=content,
            date_column=date_column,
            description_column=description_column,
            amount_column=amount_column,
            date_format=date_format,
        )
    except ValueError as e:
        status_code = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(e))
    return result
