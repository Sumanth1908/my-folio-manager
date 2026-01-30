from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlmodel import Field, SQLModel


class TransactionType(str, Enum):
    """Transaction type enumeration."""
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class Transaction(SQLModel, table=True):
    """Transaction model representing a financial transaction."""
    __tablename__ = "transactions"
    
    transaction_id: Optional[int] = Field(default=None, primary_key=True)
    account_id: str = Field(sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False))
    amount: Decimal = Field(max_digits=15, decimal_places=2)
    transaction_type: TransactionType
    currency: str = Field(default="USD", max_length=10)
    description: Optional[str] = Field(default=None, max_length=255)
    category_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("category.category_id", ondelete="SET NULL"), nullable=True))
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
