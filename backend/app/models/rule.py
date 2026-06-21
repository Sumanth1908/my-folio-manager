from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any

from sqlalchemy import Column, ForeignKey, String, JSON
from sqlmodel import Field, SQLModel


class RuleType(str, Enum):
    CATEGORIZATION = "CATEGORIZATION"
    TRANSACTION = "TRANSACTION"
    CALCULATION = "CALCULATION"

class Rule(SQLModel, table=True):
    """Rule model for account-based automations."""
    __tablename__ = "rules"
    
    rule_id: Optional[int] = Field(default=None, primary_key=True)
    account_id: str = Field(sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False))
    
    name: str = Field(max_length=100)
    rule_type: RuleType = Field(default=RuleType.CATEGORIZATION)
    
    # Scheduled rules need to be queried
    next_run_at: Optional[datetime] = None
    
    is_active: bool = Field(default=True)
    
    # JSON field for configuration (formulas, frequency, conditions)
    configuration: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
