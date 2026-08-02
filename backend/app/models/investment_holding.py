from decimal import Decimal
from typing import Any, Dict, Optional
from datetime import datetime
from sqlalchemy import Column, ForeignKey, String, JSON
from sqlmodel import Field, SQLModel

from app.models.asset import AssetType, PriceSource

class InvestmentHolding(SQLModel, table=True):
    """Represents an individual holding within an Investment account."""
    __tablename__ = "investment_holdings"

    holding_id: Optional[int] = Field(default=None, primary_key=True)
    account_id: str = Field(sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False, index=True))
    symbol: str = Field(max_length=20, index=True)
    name: str = Field(max_length=100)
    quantity: Decimal = Field(max_digits=15, decimal_places=4)
    average_price: Decimal = Field(max_digits=15, decimal_places=2)
    current_price: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    currency: str = Field(default="USD", max_length=10)
    stock_exchange: Optional[str] = Field(default=None, max_length=10)  # Exchange suffix (e.g., .NS, .L)
    last_price_update: Optional[datetime] = Field(default=None)  # Timestamp of last price fetch
    asset_type: str = Field(
        default=AssetType.EQUITY.value,
        sa_column=Column(String(40), nullable=False, index=True),
    )
    unit: str = Field(default="unit", max_length=20)
    price_source: str = Field(default=PriceSource.MARKET.value, max_length=20)
    metadata_: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
