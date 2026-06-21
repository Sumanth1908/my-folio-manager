import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, Optional

from sqlalchemy import Column, ForeignKey, String, JSON
from sqlmodel import Field, SQLModel


class AccountType(str, Enum):
    """Account type enumeration."""
    SAVINGS = "SAVINGS"
    INVESTMENT = "INVESTMENT"
    LOAN = "LOAN"
    FIXED_DEPOSIT = "FIXED_DEPOSIT"
    RECURRING_DEPOSIT = "RECURRING_DEPOSIT"

class Account(SQLModel, table=True):
    """Unified Account model for all account types."""
    __tablename__ = "accounts"

    account_id: str | None = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    user_id: str = Field(sa_column=Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True))
    account_type: AccountType = Field(index=True)
    account_name: str | None = Field(default=None, max_length=30)
    currency: str = Field(default="USD", max_length=10)
    status: str = Field(default="Active", max_length=20)
    is_interest_enabled: bool = Field(default=False)
    
    # Type-specific configuration/metadata (e.g., interest_rate, loan_amount, maturity_date)
    metadata_: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)})
