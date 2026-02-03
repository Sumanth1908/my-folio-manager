from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.models.user import User
from app.schemas.investment import InvestmentHoldingCreate, InvestmentHoldingRead, InvestmentOperation, StockSymbolSearch
from app.services import investment_service
from app.services.stock_service import search_stock_symbols
from app.deps import get_current_user

router = APIRouter(prefix="/holdings", tags=["holdings"])


@router.post("/", response_model=InvestmentHoldingRead)
def buy_holding(
    holding_in: InvestmentHoldingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Buy a new holding or increase an existing one."""
    try:
        holding = investment_service.buy_holding(session, holding_in, current_user.user_id)
        if not holding:
            raise HTTPException(status_code=404, detail="Account not found")
        return holding
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[InvestmentHoldingRead])
def read_holdings(
    account_id: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all holdings for current user, optionally filtered by account."""
    return investment_service.get_holdings(session, current_user.user_id, account_id)


@router.get("/search-symbols", response_model=List[StockSymbolSearch])
def search_symbols(
    q: str = Query(..., min_length=1, description="Search query"),
    currency: str = Query("USD", description="Currency code for exchange filtering")
):
    """Search for stock symbols with autocomplete."""
    return search_stock_symbols(q, currency, limit=10)


@router.get("/{holding_id}", response_model=InvestmentHoldingRead)
def read_holding(
    holding_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific holding."""
    holding = investment_service.get_holding_with_ownership(session, holding_id, current_user.user_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    return holding


@router.put("/{holding_id}", response_model=InvestmentHoldingRead)
@router.patch("/{holding_id}", response_model=InvestmentHoldingRead)
def update_holding(
    holding_id: int,
    holding_in: InvestmentHoldingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update an existing holding."""
    holding = investment_service.update_holding(session, holding_id, holding_in, current_user.user_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    return holding


@router.post("/{holding_id}/sell", response_model=InvestmentHoldingRead)
def sell_holding(
    holding_id: int,
    sell_in: InvestmentOperation,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Sell part or all of a holding."""
    try:
        holding = investment_service.sell_holding(session, holding_id, sell_in, current_user.user_id)
        if not holding:
            raise HTTPException(status_code=404, detail="Holding not found")
        return holding
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{holding_id}")
def delete_holding(
    holding_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a holding."""
    success = investment_service.delete_holding(session, holding_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"message": "Holding deleted successfully"}


@router.post("/refresh-prices", response_model=List[InvestmentHoldingRead])
def refresh_stock_prices(
    account_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Manually refresh stock prices for all holdings in an account."""
    try:
        return investment_service.refresh_holding_prices(session, account_id, current_user.user_id)
    except ValueError as e:
        status_code = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(e))
