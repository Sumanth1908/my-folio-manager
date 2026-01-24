from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import Column, ForeignKey, String
from sqlmodel import Field, SQLModel


class LoanAccount(SQLModel, table=True):
    """Model corresponding to 'loan_accounts' table."""
    __tablename__ = "loan_accounts"

    account_id: Optional[str] = Field(default=None, sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), primary_key=True))
    loan_amount: Decimal = Field(max_digits=15, decimal_places=2)
    outstanding_amount: Decimal = Field(default=0, max_digits=15, decimal_places=2)
    interest_rate: Decimal = Field(max_digits=5, decimal_places=2)
    tenure_months: int
    emi_amount: Decimal = Field(max_digits=15, decimal_places=2)
    start_date: date
    interest_accrual_day: Optional[int] = Field(default=1)  # Day of month (1-31) for EMI and interest
