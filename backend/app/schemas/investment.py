from decimal import Decimal
from typing import Any, Dict, Optional
from datetime import datetime
from pydantic import BaseModel, field_validator

from app.models.asset import AssetType, PriceSource


def _normalize_identifier(value: str, field_name: str) -> str:
    normalized = value.strip().upper().replace(" ", "_")
    if not normalized or len(normalized) > 40 or not normalized.replace("_", "").isalnum():
        raise ValueError(f"{field_name} must contain only letters, numbers, and underscores")
    return normalized

class InvestmentHoldingBase(BaseModel):
    symbol: str
    name: str
    quantity: Decimal
    average_price: Decimal
    current_price: Optional[Decimal] = None
    currency: str = "USD"
    stock_exchange: Optional[str] = None
    last_price_update: Optional[datetime] = None
    asset_type: str = AssetType.EQUITY.value
    unit: str = "unit"
    price_source: str = PriceSource.MARKET.value
    metadata_: Optional[Dict[str, Any]] = None

    @field_validator("asset_type", mode="before")
    @classmethod
    def normalize_asset_type(cls, value: str | AssetType) -> str:
        return _normalize_identifier(value.value if isinstance(value, AssetType) else value, "asset_type")

    @field_validator("price_source", mode="before")
    @classmethod
    def normalize_price_source(cls, value: str | PriceSource) -> str:
        normalized = _normalize_identifier(
            value.value if isinstance(value, PriceSource) else value,
            "price_source",
        )
        if normalized not in {source.value for source in PriceSource}:
            raise ValueError("price_source must be MANUAL or MARKET")
        return normalized

class InvestmentHoldingCreate(InvestmentHoldingBase):
    account_id: str
    transaction_date: Optional[datetime] = None

class InvestmentOperation(BaseModel):
    quantity: Decimal
    price: Decimal
    description: Optional[str] = None
    transaction_date: Optional[datetime] = None

class InvestmentHoldingRead(InvestmentHoldingBase):
    holding_id: int
    account_id: str

class StockSymbolSearch(BaseModel):
    """Stock symbol search result."""
    symbol: str
    name: str
    exchange: str
