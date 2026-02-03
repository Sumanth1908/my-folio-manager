from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.database import get_session
from app.deps import get_current_user
from app.models.user import User
from app.schemas.summary import SummaryResponse
from app.services import summary_service

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/accounts", response_model=SummaryResponse)
def get_accounts_summary(
    account_types: Optional[List[str]] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get financial summary by category for user accounts."""
    return summary_service.get_accounts_summary(
        session, current_user.user_id, account_types, from_date, to_date
    )
