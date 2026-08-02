import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from sqlmodel import Session, select

from app.models.account import Account
from app.models.asset import AssetType, PriceSource
from app.models.investment_holding import InvestmentHolding
from app.models.category import Category
from app.schemas.transaction import TransactionCreate
from app.schemas.investment import InvestmentHoldingCreate, InvestmentOperation
from app.services.transaction_service import create_transaction_core
from app.services.stock_service import get_exchange_suffix, get_stock_prices_batch
from app.services.account_types import get_account_type_definition

logger = logging.getLogger(__name__)


def get_holdings(session: Session, user_id: str, account_id: str = None) -> List[InvestmentHolding]:
    """Get all holdings for a user, optionally filtered by account."""
    if account_id:
        query = select(InvestmentHolding).join(Account).where(
            Account.user_id == user_id,
            InvestmentHolding.account_id == account_id
        )
    else:
        query = select(InvestmentHolding).join(Account).where(Account.user_id == user_id)
    return session.exec(query).all()


def get_holding_with_ownership(session: Session, holding_id: int, user_id: str) -> Optional[InvestmentHolding]:
    """Fetch a holding and verify it belongs to the user."""
    result = session.exec(
        select(InvestmentHolding)
        .join(Account)
        .where(InvestmentHolding.holding_id == holding_id)
        .where(Account.user_id == user_id)
    ).first()
    return result


def buy_holding(session: Session, holding_in: InvestmentHoldingCreate, user_id: str) -> Optional[InvestmentHolding]:
    """Buy a new holding or increase an existing one."""
    account = session.get(Account, holding_in.account_id)
    if not account or account.user_id != user_id:
        return None
    
    if not get_account_type_definition(account.account_type, account.metadata_).supports_holdings:
        raise ValueError("This account type does not support holdings")
    if holding_in.quantity <= 0 or holding_in.average_price < 0:
        raise ValueError("Quantity must be positive and price cannot be negative")

    existing_holding = session.exec(
        select(InvestmentHolding).where(
            InvestmentHolding.account_id == holding_in.account_id,
            InvestmentHolding.symbol == holding_in.symbol,
            InvestmentHolding.asset_type == holding_in.asset_type,
        )
    ).first()

    if existing_holding:
        total_old_cost = existing_holding.quantity * existing_holding.average_price
        total_new_cost = holding_in.quantity * holding_in.average_price
        
        existing_holding.quantity += holding_in.quantity
        existing_holding.average_price = ((total_old_cost + total_new_cost) / existing_holding.quantity).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        if holding_in.name:
            existing_holding.name = holding_in.name
        if holding_in.current_price is not None:
            existing_holding.current_price = holding_in.current_price
        existing_holding.currency = holding_in.currency
        existing_holding.unit = holding_in.unit
        existing_holding.price_source = holding_in.price_source
        if holding_in.metadata_ is not None:
            existing_holding.metadata_ = {
                **(existing_holding.metadata_ or {}),
                **holding_in.metadata_,
            }
        holding = existing_holding
    else:
        exchange_suffix = get_exchange_suffix(holding_in.currency)
        holding_data = holding_in.model_dump()
        if (
            holding_in.asset_type in {AssetType.EQUITY.value, AssetType.ETF.value, AssetType.MUTUAL_FUND.value}
            and '.' not in holding_in.symbol
            and exchange_suffix
        ):
            holding_data['stock_exchange'] = exchange_suffix
        holding = InvestmentHolding(**holding_data)
    
    session.add(holding)
    
    total_cost = (holding_in.quantity * holding_in.average_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    cat_query = select(Category).where(Category.name == "Investment", Category.user_id == user_id)
    category = session.exec(cat_query).first()
    
    transaction_in = TransactionCreate(
        account_id=holding.account_id,
        amount=-abs(total_cost),
        currency=holding.currency or account.currency,
        description=f"Investment Purchase: {holding_in.quantity} {holding.symbol} @ {holding_in.average_price}",
        category_id=category.category_id if category else None,
        transaction_date=holding_in.transaction_date
    )
    
    create_transaction_core(session, transaction_in, user_id)
    session.refresh(holding)
    return holding


def sell_holding(session: Session, holding_id: int, sell_in: InvestmentOperation, user_id: str) -> Optional[InvestmentHolding]:
    """Sell part or all of a holding."""
    holding = get_holding_with_ownership(session, holding_id, user_id)
    if not holding:
        return None
    if sell_in.quantity <= 0 or sell_in.price < 0:
        raise ValueError("Quantity must be positive and price cannot be negative")

    if holding.quantity < sell_in.quantity:
        raise ValueError("Insufficient quantity to sell")

    account = session.get(Account, holding.account_id)
    holding.quantity -= sell_in.quantity
    
    total_revenue = (sell_in.quantity * sell_in.price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    cat_query = select(Category).where(Category.name == "Investment", Category.user_id == user_id)
    category = session.exec(cat_query).first()
    
    transaction_in = TransactionCreate(
        account_id=holding.account_id,
        amount=abs(total_revenue),
        currency=holding.currency or account.currency,
        description=f"Investment Sale: {sell_in.quantity} {holding.symbol} @ {sell_in.price}",
        category_id=category.category_id if category else None,
        transaction_date=sell_in.transaction_date
    )
    
    if holding.quantity == 0:
        session.delete(holding)
    else:
        session.add(holding)
    
    create_transaction_core(session, transaction_in, user_id)
    return holding


def update_holding(session: Session, holding_id: int, holding_in: InvestmentHoldingCreate, user_id: str) -> Optional[InvestmentHolding]:
    """Update a holding if it belongs to the user."""
    holding = get_holding_with_ownership(session, holding_id, user_id)
    if not holding:
        return None

    target_account = session.get(Account, holding_in.account_id)
    if not target_account or target_account.user_id != user_id:
        raise ValueError("Target account not found")
    if not get_account_type_definition(target_account.account_type, target_account.metadata_).supports_holdings:
        raise ValueError("Target account type does not support holdings")
    if holding_in.quantity <= 0 or holding_in.average_price < 0:
        raise ValueError("Quantity must be positive and price cannot be negative")

    for key, value in holding_in.model_dump(exclude={"transaction_date"}, exclude_unset=True).items():
        setattr(holding, key, value)
    
    session.add(holding)
    session.commit()
    session.refresh(holding)
    return holding


def delete_holding(session: Session, holding_id: int, user_id: str) -> bool:
    """Delete a holding if it belongs to the user."""
    holding = get_holding_with_ownership(session, holding_id, user_id)
    if not holding:
        return False
        
    session.delete(holding)
    session.commit()
    return True


def refresh_holding_prices(session: Session, account_id: str, user_id: str) -> List[InvestmentHolding]:
    """Manually refresh stock prices for all holdings in an account."""
    account = session.get(Account, account_id)
    if not account or account.user_id != user_id:
        raise ValueError("Account not found")
    
    if not get_account_type_definition(account.account_type, account.metadata_).supports_holdings:
        raise ValueError("This account type does not support holdings")
    
    holdings = session.exec(
        select(InvestmentHolding).where(InvestmentHolding.account_id == account_id)
    ).all()
    
    market_asset_types = {
        AssetType.EQUITY.value,
        AssetType.ETF.value,
        AssetType.MUTUAL_FUND.value,
    }
    holdings = [
        holding
        for holding in holdings
        if holding.price_source == PriceSource.MARKET.value
        and holding.asset_type in market_asset_types
    ]

    if not holdings:
        return []
    
    symbols = []
    for holding in holdings:
        symbol = holding.symbol
        if holding.stock_exchange:
            symbol = f"{symbol}{holding.stock_exchange}"
        elif '.' not in symbol:
            exchange_suffix = get_exchange_suffix(holding.currency)
            if exchange_suffix:
                symbol = f"{symbol}{exchange_suffix}"
        symbols.append(symbol)
    
    prices = get_stock_prices_batch(symbols)
    
    now = datetime.now(timezone.utc)
    for holding, symbol in zip(holdings, symbols):
        if symbol in prices and prices[symbol] is not None:
            holding.current_price = prices[symbol]
            holding.last_price_update = now
            session.add(holding)
    
    session.commit()
    for holding in holdings:
        session.refresh(holding)
    
    return holdings
