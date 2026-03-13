from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlmodel import Field, SQLModel

from app.models.transaction import TransactionType


class RuleType(str, Enum):
    CATEGORIZATION = "CATEGORIZATION"
    TRANSACTION = "TRANSACTION"
    CALCULATION = "CALCULATION"

class Frequency(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"
    ONE_TIME = "ONE_TIME"

class Rule(SQLModel, table=True):
    """Rule model for account-based automations."""
    __tablename__ = "rules"
    
    rule_id: Optional[int] = Field(default=None, primary_key=True)
    account_id: str = Field(sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False))
    
    name: str = Field(max_length=100)
    rule_type: RuleType = Field(default=RuleType.CATEGORIZATION)
    
    # Categorization Rules
    description_contains: Optional[str] = Field(default=None, max_length=255)
    
    # Common Action
    category_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("category.category_id", ondelete="SET NULL"), nullable=True))
    
    # Transaction Automation Rules
    frequency: Optional[Frequency] = None
    next_run_at: Optional[datetime] = None
    end_date: Optional[datetime] = None
    transaction_amount: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    transaction_type: Optional[TransactionType] = None
    target_account_id: Optional[str] = Field(default=None, sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=True))
    
    # Calculation Rules (Formula based)
    formula: Optional[str] = Field(default=None, max_length=500, description="Mathematical formula using account fields")
    
    is_active: bool = Field(default=True)
