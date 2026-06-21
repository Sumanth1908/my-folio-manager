from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel, Field

from app.models.rule import RuleType


class RuleBase(BaseModel):
    name: str
    rule_type: RuleType = RuleType.CATEGORIZATION
    is_active: bool = True
    next_run_at: Optional[datetime] = None
    configuration: Optional[Dict[str, Any]] = Field(default_factory=dict)

class RuleCreate(RuleBase):
    account_id: str

class RuleRead(RuleBase):
    rule_id: int
    account_id: str
    category_name: Optional[str] = None

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    rule_type: Optional[RuleType] = None
    is_active: Optional[bool] = None
    next_run_at: Optional[datetime] = None
    configuration: Optional[Dict[str, Any]] = None
