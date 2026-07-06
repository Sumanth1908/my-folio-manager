from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.core.database import get_session
from app.deps import get_current_user
from app.models.user import User
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _parse_month(month: str) -> date:
    try:
        parsed = datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=422, detail="month must be in YYYY-MM format")
    return date(parsed.year, parsed.month, 1)


class BudgetUpsert(BaseModel):
    category_id: int
    amount: Decimal = Field(gt=0)
    period_month: str
    apply_to_future_months: int = Field(default=0, ge=0, le=11)


class BudgetRead(BaseModel):
    budget_id: int
    category_id: int
    category_name: Optional[str] = None
    amount: float
    period_month: str
    spent_by_currency: dict[str, float]


class YearlyBudgetMonth(BaseModel):
    period_month: str
    amount: Optional[float] = None
    spent_by_currency: dict[str, float]


class YearlyBudgetCategory(BaseModel):
    category_id: int
    category_name: Optional[str] = None
    months: List[YearlyBudgetMonth]
    total_amount: float
    total_spent_by_currency: dict[str, float]


@router.get("/", response_model=List[BudgetRead])
def list_budgets(
    month: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Budgets with the given month's spend and remaining amounts (defaults to the current month)."""
    period_month = _parse_month(month) if month else None
    return budget_service.get_budgets_with_spend(session, current_user.user_id, period_month)


@router.get("/yearly", response_model=List[YearlyBudgetCategory])
def yearly_budgets(
    year: int = Query(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Month-by-month budget/spend breakdown per category for a calendar year."""
    return budget_service.get_yearly_budgets(session, current_user.user_id, year)


@router.put("/", response_model=dict)
def upsert_budget(
    budget_in: BudgetUpsert,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create or update the budget for a category in a specific month (optionally carried forward N months)."""
    period_month = _parse_month(budget_in.period_month)
    try:
        budget = budget_service.upsert_budget(
            session,
            current_user.user_id,
            budget_in.category_id,
            budget_in.amount,
            period_month,
            budget_in.apply_to_future_months,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {
        "budget_id": budget.budget_id,
        "category_id": budget.category_id,
        "amount": float(budget.amount),
        "period_month": budget.period_month.strftime("%Y-%m"),
    }


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Remove a budget."""
    if not budget_service.delete_budget(session, current_user.user_id, budget_id):
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"ok": True}
