from decimal import Decimal
from typing import List
from pydantic import BaseModel


class HoldingSummary(BaseModel):
    """Summary of a single holding."""
    symbol: str
    name: str
    quantity: Decimal
    current_price: Decimal
    current_value: Decimal
    cost_basis: Decimal
    profit_loss: Decimal
    profit_loss_percent: Decimal
    currency: str


class AccountPortfolioSummary(BaseModel):
    """Portfolio summary for a single investment account."""
    account_id: str
    account_name: str
    currency: str
    total_value: Decimal
    total_cost: Decimal
    total_profit_loss: Decimal
    total_profit_loss_percent: Decimal
    holdings: List[HoldingSummary]


class PortfolioSummaryResponse(BaseModel):
    """Complete portfolio summary."""
    accounts: List[AccountPortfolioSummary]
    total_value_default_currency: Decimal
    total_cost_default_currency: Decimal
    total_profit_loss_default_currency: Decimal
    total_profit_loss_percent: Decimal
    default_currency: str
