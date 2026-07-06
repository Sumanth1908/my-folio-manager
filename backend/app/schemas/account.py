from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any

from pydantic import BaseModel, ConfigDict

from app.models.account import AccountType
from app.schemas.investment import InvestmentHoldingRead


class AccountBase(BaseModel):
    account_name: str | None = None
    account_type: AccountType = AccountType.SAVINGS
    currency: str = "USD"
    status: str = "Active"
    is_interest_enabled: bool = False
    metadata_: Optional[Dict[str, Any]] = None

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    account_name: str | None = None
    currency: str | None = None
    status: str | None = None
    is_interest_enabled: bool | None = None
    metadata_: Optional[Dict[str, Any]] = None

class AccountRead(AccountBase):
    model_config = ConfigDict(from_attributes=True)
    account_id: str
    created_at: datetime
    balance: Decimal = Decimal("0.00")
    investment_holdings: list[InvestmentHoldingRead] | None = None

class AccountCloseRequest(BaseModel):
    # Account to debit the outstanding balance from. If omitted, the payoff is recorded
    # as a standalone transaction on the account itself (e.g. paid via cash/external means).
    source_account_id: Optional[str] = None
