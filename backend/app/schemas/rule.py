from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.rule import Frequency, RuleType
from app.models.transaction import TransactionType


class RuleBase(BaseModel):
    name: str
    rule_type: RuleType = RuleType.CATEGORIZATION
    is_active: bool = True
    
    # Categorization
    description_contains: Optional[str] = None
    category_id: Optional[int] = None
    
    # Automation
    frequency: Optional[Frequency] = None
    next_run_at: Optional[datetime] = None
    transaction_amount: Optional[Decimal] = None
    transaction_type: Optional[TransactionType] = None
    target_account_id: Optional[str] = None

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
    
    description_contains: Optional[str] = None
    category_id: Optional[int] = None
    
    frequency: Optional[Frequency] = None
    next_run_at: Optional[datetime] = None
    transaction_amount: Optional[Decimal] = None
    transaction_type: Optional[TransactionType] = None
    target_account_id: Optional[str] = None
