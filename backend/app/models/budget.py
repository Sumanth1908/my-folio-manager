from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Column, Date, ForeignKey, Integer, String, UniqueConstraint
from sqlmodel import Field, SQLModel


class Budget(SQLModel, table=True):
    """Spending budget for a category in a specific month."""
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "period_month", name="uq_budget_user_category_month"),
    )

    budget_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(
        sa_column=Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    )
    category_id: int = Field(
        sa_column=Column(Integer, ForeignKey("category.category_id", ondelete="CASCADE"), nullable=False)
    )
    amount: Decimal = Field(max_digits=15, decimal_places=2)
    period_month: date = Field(sa_column=Column(Date, nullable=False))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
