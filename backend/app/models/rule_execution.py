from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer
from sqlmodel import Field, SQLModel


class RuleExecutionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class RuleExecution(SQLModel, table=True):
    """Audit trail of automation rule runs and what they posted."""
    __tablename__ = "rule_executions"

    execution_id: Optional[int] = Field(default=None, primary_key=True)
    rule_id: int = Field(
        sa_column=Column(Integer, ForeignKey("rules.rule_id", ondelete="CASCADE"), nullable=False, index=True)
    )
    ran_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    status: RuleExecutionStatus = Field(default=RuleExecutionStatus.SUCCESS)
    amount: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    transaction_id: Optional[int] = Field(default=None)
    transfer_id: Optional[str] = Field(default=None, max_length=36)
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    error: Optional[str] = Field(default=None, max_length=500)
