import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, ForeignKey, String
from sqlmodel import Field, SQLModel


class AccountType(str, Enum):
    """Account type enumeration."""
    SAVINGS = "Savings"
    INVESTMENT = "Investment"
    LOAN = "Loan"
    FIXED_DEPOSIT = "Fixed Deposit"

class Account(SQLModel, table=True):
    """Base Account model corresponding to 'accounts' table."""
    __tablename__ = "accounts"

    account_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    user_id: str = Field(sa_column=Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True))
    account_type: AccountType = Field(index=True)
    account_name: Optional[str] = Field(default=None, max_length=30)
    currency: str = Field(default="USD", max_length=10)
    status: str = Field(default="Active", max_length=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
