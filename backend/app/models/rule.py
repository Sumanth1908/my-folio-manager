from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any

from sqlalchemy import Column, ForeignKey, Integer, String, JSON
from sqlmodel import Field, SQLModel


class RuleType(str, Enum):
    CATEGORIZATION = "CATEGORIZATION"
    TRANSACTION = "TRANSACTION"
    CALCULATION = "CALCULATION"
    INTEREST = "INTEREST"

class Rule(SQLModel, table=True):
    """Rule model for account-based automations."""
    __tablename__ = "rules"
    
    rule_id: Optional[int] = Field(default=None, primary_key=True)
    account_id: str = Field(sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False))
    
    name: str = Field(max_length=100)
    rule_type: RuleType = Field(
        default=RuleType.CATEGORIZATION,
        sa_column=Column(String(30), nullable=False),
    )
    
    # Scheduled rules need to be queried
    next_run_at: Optional[datetime] = None

    # Lower values run first when multiple rules are due at the same time.
    # Generated interest rules use a later default so deposits/transfers have
    # already reached the ledger before interest is settled.
    execution_order: int = Field(
        default=100,
        sa_column=Column(Integer, nullable=False, server_default="100", index=True),
    )
    
    is_active: bool = Field(default=True)
    
    # JSON field for configuration (formulas, frequency, conditions)
    configuration: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
