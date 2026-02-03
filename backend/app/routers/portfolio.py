from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.deps import get_current_user
from app.models.user import User
from app.schemas.portfolio import PortfolioSummaryResponse
from app.services import portfolio_service

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/summary", response_model=PortfolioSummaryResponse)
def get_portfolio_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get complete portfolio summary for the user."""
    return portfolio_service.get_portfolio_summary(session, current_user.user_id)
