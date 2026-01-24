from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

class InvestmentHoldingBase(BaseModel):
    symbol: str
    name: str
    quantity: Decimal
    average_price: Decimal
    current_price: Optional[Decimal] = None
    currency: str = "USD"

class InvestmentHoldingCreate(InvestmentHoldingBase):
    account_id: str

class InvestmentOperation(BaseModel):
    quantity: Decimal
    price: Decimal
    description: Optional[str] = None

class InvestmentHoldingRead(InvestmentHoldingBase):
    holding_id: int
    account_id: str
