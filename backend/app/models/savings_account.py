from decimal import Decimal
from typing import Optional

from sqlalchemy import Column, ForeignKey, String
from sqlmodel import Field, SQLModel


class SavingsAccount(SQLModel, table=True):
    """Model corresponding to 'savings_accounts' table."""
    __tablename__ = "savings_accounts"

    account_id: Optional[str] = Field(default=None, sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), primary_key=True))
    balance: Decimal = Field(default=0, max_digits=15, decimal_places=2)
    interest_rate: Optional[Decimal] = Field(default=None, max_digits=5, decimal_places=2)
    min_balance: Optional[Decimal] = Field(default=0, max_digits=15, decimal_places=2)
    interest_accrual_day: Optional[int] = Field(default=1)  # Day of month (1-31) for interest accrual
