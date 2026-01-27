from datetime import date
from decimal import Decimal

from sqlalchemy import Column, ForeignKey, String
from sqlmodel import Field, SQLModel


class FixedDepositAccount(SQLModel, table=True):
    """Model corresponding to 'fixed_deposit_accounts' table."""
    __tablename__ = "fixed_deposit_accounts"

    account_id: str | None = Field(default=None, sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), primary_key=True))
    principal_amount: Decimal = Field(max_digits=15, decimal_places=2)
    interest_rate: Decimal = Field(max_digits=5, decimal_places=2)
    start_date: date
    maturity_date: date
    maturity_amount: Decimal = Field(max_digits=15, decimal_places=2)
    interest_accrual_day: int | None = Field(default=1)  # Day of month (1-31) for interest accrual
