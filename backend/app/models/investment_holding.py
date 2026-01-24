import uuid
from decimal import Decimal
from typing import Optional
from sqlalchemy import Column, ForeignKey, String, Integer
from sqlmodel import Field, SQLModel

class InvestmentHolding(SQLModel, table=True):
    """Represents an individual holding within an Investment account."""
    __tablename__ = "investment_holdings"

    holding_id: Optional[int] = Field(default=None, primary_key=True)
    account_id: str = Field(sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False, index=True))
    symbol: str = Field(max_length=20, index=True)
    name: str = Field(max_length=100)
    quantity: Decimal = Field(max_digits=15, decimal_places=4)
    average_price: Decimal = Field(max_digits=15, decimal_places=2)
    current_price: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    currency: str = Field(default="USD", max_length=10)
