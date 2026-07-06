from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class CategorySummary(BaseModel):
    name: str
    total_amount: float
    transaction_type: str # 'Debit' or 'Credit'

class AccountSummary(BaseModel):
    account_id: str
    account_name: Optional[str]
    account_type: str
    currency: str
    categories: List[CategorySummary]

class SummaryResponse(BaseModel):
    accounts: List[AccountSummary]

class UpcomingItem(BaseModel):
    date: datetime
    kind: str  # RULE | MATURITY | LOAN_END
    name: str
    account_id: str
    account_name: Optional[str] = None
    account_type: str
    amount: Optional[float] = None
    rule_id: Optional[int] = None

class UpcomingResponse(BaseModel):
    items: List[UpcomingItem]
