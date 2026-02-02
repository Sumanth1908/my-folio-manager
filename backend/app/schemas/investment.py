from decimal import Decimal
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class InvestmentHoldingBase(BaseModel):
    symbol: str
    name: str
    quantity: Decimal
    average_price: Decimal
    current_price: Optional[Decimal] = None
    currency: str = "USD"
    stock_exchange: Optional[str] = None
    last_price_update: Optional[datetime] = None

class InvestmentHoldingCreate(InvestmentHoldingBase):
    account_id: str

class InvestmentOperation(BaseModel):
    quantity: Decimal
    price: Decimal
    description: Optional[str] = None

class InvestmentHoldingRead(InvestmentHoldingBase):
    holding_id: int
    account_id: str

class StockSymbolSearch(BaseModel):
    """Stock symbol search result."""
    symbol: str
    name: str
    exchange: str
