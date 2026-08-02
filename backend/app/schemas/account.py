from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.account import AccountType
from app.schemas.investment import InvestmentHoldingRead


class AccountBase(BaseModel):
    account_name: str | None = None
    account_type: str = AccountType.SAVINGS.value
    currency: str = "USD"
    status: str = "Active"
    is_interest_enabled: bool = False
    metadata_: Optional[Dict[str, Any]] = None

    @field_validator("account_type", mode="before")
    @classmethod
    def normalize_type(cls, value: str | AccountType) -> str:
        from app.services.account_types import normalize_account_type

        return normalize_account_type(value)

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
    asset_holdings: list[InvestmentHoldingRead] | None = None
    asset_value: Decimal = Decimal("0.00")
    net_value: Decimal = Decimal("0.00")
    account_nature: str = "ASSET"

class AccountCloseRequest(BaseModel):
    # Account to debit the outstanding balance from. If omitted, the payoff is recorded
    # as a standalone transaction on the account itself (e.g. paid via cash/external means).
    source_account_id: Optional[str] = None


class AccountTypeRead(BaseModel):
    key: str
    label: str
    nature: str
    supports_holdings: bool
    supports_interest: bool
    valuation_mode: str
