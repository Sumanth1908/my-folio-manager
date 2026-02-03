import logging
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from sqlmodel import Session, select

from app.models.account import Account, AccountType
from app.models.investment_holding import InvestmentHolding
from app.models.category import Category
from app.models.transaction import TransactionType
from app.schemas.transaction import TransactionCreate
from app.schemas.investment import InvestmentHoldingCreate, InvestmentOperation
from app.services.transaction_service import create_transaction_core
from app.services.stock_service import get_exchange_suffix, get_stock_prices_batch

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
    
    if account.account_type != AccountType.INVESTMENT:
        raise ValueError("Only investment accounts can have holdings")

    existing_holding = session.exec(
        select(InvestmentHolding).where(
            InvestmentHolding.account_id == holding_in.account_id,
            InvestmentHolding.symbol == holding_in.symbol
        )
    ).first()

    if existing_holding:
        total_old_cost = existing_holding.quantity * existing_holding.average_price
        total_new_cost = holding_in.quantity * holding_in.average_price
        
        existing_holding.quantity += holding_in.quantity
        existing_holding.average_price = ((total_old_cost + total_new_cost) / existing_holding.quantity).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        if holding_in.name:
            existing_holding.name = holding_in.name
        holding = existing_holding
    else:
        exchange_suffix = get_exchange_suffix(holding_in.currency)
        holding_data = holding_in.model_dump()
        if '.' not in holding_in.symbol and exchange_suffix:
            holding_data['stock_exchange'] = exchange_suffix
        holding = InvestmentHolding(**holding_data)
    
    session.add(holding)
    
    total_cost = (holding_in.quantity * holding_in.average_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    cat_query = select(Category).where(Category.name == "Investment", Category.user_id == user_id)
    category = session.exec(cat_query).first()
    
    transaction_in = TransactionCreate(
        account_id=holding.account_id,
        amount=total_cost,
        transaction_type=TransactionType.DEBIT,
        currency=holding.currency or account.currency,
        description=f"Investment Purchase: {holding_in.quantity} {holding.symbol} @ {holding_in.average_price}",
        category_id=category.category_id if category else None
    )
    
    create_transaction_core(session, transaction_in, user_id)
    session.refresh(holding)
    return holding


def sell_holding(session: Session, holding_id: int, sell_in: InvestmentOperation, user_id: str) -> Optional[InvestmentHolding]:
    """Sell part or all of a holding."""
    holding = get_holding_with_ownership(session, holding_id, user_id)
    if not holding:
        return None
    
    if holding.quantity < sell_in.quantity:
        raise ValueError("Insufficient quantity to sell")

    account = session.get(Account, holding.account_id)
    holding.quantity -= sell_in.quantity
    
    total_revenue = (sell_in.quantity * sell_in.price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    cat_query = select(Category).where(Category.name == "Investment", Category.user_id == user_id)
    category = session.exec(cat_query).first()
    
    transaction_in = TransactionCreate(
        account_id=holding.account_id,
        amount=total_revenue,
        transaction_type=TransactionType.CREDIT,
        currency=holding.currency or account.currency,
        description=f"Investment Sale: {sell_in.quantity} {holding.symbol} @ {sell_in.price}",
        category_id=category.category_id if category else None
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
        
    for key, value in holding_in.model_dump().items():
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
    
    if account.account_type != AccountType.INVESTMENT:
        raise ValueError("Only investment accounts have stock holdings")
    
    holdings = session.exec(
        select(InvestmentHolding).where(InvestmentHolding.account_id == account_id)
    ).all()
    
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
    
    now = datetime.utcnow()
    for holding, symbol in zip(holdings, symbols):
        if symbol in prices and prices[symbol] is not None:
            holding.current_price = prices[symbol]
            holding.last_price_update = now
            session.add(holding)
    
    session.commit()
    for holding in holdings:
        session.refresh(holding)
    
    return holdings
