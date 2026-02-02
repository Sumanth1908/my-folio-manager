from typing import List, Optional
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.account import Account, AccountType
from app.models.investment_holding import InvestmentHolding
from app.models.user import User
from app.schemas.investment import InvestmentHoldingCreate, InvestmentHoldingRead, InvestmentOperation, StockSymbolSearch
from app.deps import get_current_user
from app.models.category import Category
from app.models.transaction import TransactionType
from app.schemas.transaction import TransactionCreate
from app.services.transaction_service import create_transaction_core
from app.services.stock_service import get_exchange_suffix, get_stock_prices_batch, search_stock_symbols

router = APIRouter(prefix="/holdings", tags=["holdings"])

@router.post("/", response_model=InvestmentHoldingRead)
def buy_holding(
    holding_in: InvestmentHoldingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Buy a new holding or increase an existing one."""
    account = session.get(Account, holding_in.account_id)
    if not account or account.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account.account_type != AccountType.INVESTMENT:
        raise HTTPException(status_code=400, detail="Only investment accounts can have holdings")

    # Check if a holding for this symbol already exists in this account
    existing_holding = session.exec(
        select(InvestmentHolding).where(
            InvestmentHolding.account_id == holding_in.account_id,
            InvestmentHolding.symbol == holding_in.symbol
        )
    ).first()

    if existing_holding:
        # Calculate new average price
        total_old_cost = existing_holding.quantity * existing_holding.average_price
        total_new_cost = holding_in.quantity * holding_in.average_price
        
        existing_holding.quantity += holding_in.quantity
        existing_holding.average_price = ((total_old_cost + total_new_cost) / existing_holding.quantity).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # In case a name update is provided
        if holding_in.name:
            existing_holding.name = holding_in.name
            
        holding = existing_holding
    else:
        # Auto-populate exchange suffix if not present
        exchange_suffix = get_exchange_suffix(holding_in.currency)
        holding_data = holding_in.model_dump()
        if '.' not in holding_in.symbol and exchange_suffix:
            holding_data['stock_exchange'] = exchange_suffix
        holding = InvestmentHolding(**holding_data)
    
    session.add(holding)
    
    # Automatically create a debit transaction for the purchase using TransactionService
    total_cost = (holding.quantity * holding.average_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    # Find the "Investment" category for this user    
    cat_query = select(Category).where(Category.name == "Investment", Category.user_id == current_user.user_id)
    category = session.exec(cat_query).first()
    
    transaction_in = TransactionCreate(
        account_id=holding.account_id,
        amount=total_cost,
        transaction_type=TransactionType.DEBIT,
        currency=holding.currency or account.currency,
        description=f"Investment Purchase: {holding.quantity} {holding.symbol} @ {holding.average_price}",
        category_id=category.category_id if category else None
    )
    
    # This also commits the session, including the new holding
    create_transaction_core(session, transaction_in)
    
    session.refresh(holding)
    return holding

@router.get("/", response_model=List[InvestmentHoldingRead])
def read_holdings(
    account_id: Optional[str] = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all holdings for current user, optionally filtered by account."""
    if account_id:
        account = session.get(Account, account_id)
        if not account or account.user_id != current_user.user_id:
            raise HTTPException(status_code=404, detail="Account not found")
        
        query = select(InvestmentHolding).where(InvestmentHolding.account_id == account_id)
    else:
        # Get holdings for all investment accounts of the user
        query = (
            select(InvestmentHolding)
            .join(Account)
            .where(Account.user_id == current_user.user_id)
        )
    
    holdings = session.exec(query).all()
    return holdings

@router.get("/search-symbols", response_model=List[StockSymbolSearch])
def search_symbols(
    q: str = Query(..., min_length=1, description="Search query"),
    currency: str = Query("USD", description="Currency code for exchange filtering")
):
    """Search for stock symbols with autocomplete."""
    results = search_stock_symbols(q, currency, limit=10)
    return results

@router.get("/{holding_id}", response_model=InvestmentHoldingRead)
def read_holding(
    holding_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific holding."""
    holding = session.get(InvestmentHolding, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    account = session.get(Account, holding.account_id)
    if account.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return holding

@router.put("/{holding_id}", response_model=InvestmentHoldingRead)
@router.patch("/{holding_id}", response_model=InvestmentHoldingRead)
def update_holding(
    holding_id: int,
    holding_in: InvestmentHoldingCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update an existing holding."""
    holding = session.get(InvestmentHolding, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    account = session.get(Account, holding.account_id)
    if account.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for key, value in holding_in.model_dump().items():
        setattr(holding, key, value)
    
    session.add(holding)
    session.commit()
    session.refresh(holding)
    return holding

@router.post("/{holding_id}/sell", response_model=InvestmentHoldingRead)
def sell_holding(
    holding_id: int,
    sell_in: InvestmentOperation,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Sell part or all of a holding."""
    holding = session.get(InvestmentHolding, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    account = session.get(Account, holding.account_id)
    if account.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if holding.quantity < sell_in.quantity:
        raise HTTPException(status_code=400, detail="Insufficient quantity to sell")

    # Update holding quantity
    holding.quantity -= sell_in.quantity
    
    # Create a credit transaction for the sale    
    total_revenue = (sell_in.quantity * sell_in.price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    cat_query = select(Category).where(Category.name == "Investment", Category.user_id == current_user.user_id)
    category = session.exec(cat_query).first()
    
    transaction_in = TransactionCreate(
        account_id=holding.account_id,
        amount=total_revenue,
        transaction_type=TransactionType.CREDIT,
        currency=holding.currency or account.currency,
        description=f"Investment Sale: {sell_in.quantity} {holding.symbol} @ {sell_in.price}",
        category_id=category.category_id if category else None
    )
    
    # Check if we should delete the holding if quantity is zero
    if holding.quantity == 0:
        session.delete(holding)
    else:
        session.add(holding)
    
    create_transaction_core(session, transaction_in)
    
    # Return the holding (or a dummy if deleted, but InvestmentHoldingRead needs an object)
    if holding.quantity == 0:
         # Return the object before deletion for the response if needed, 
         # but session.delete might make it tricky. 
         # Let's refresh only if not deleted.
         return holding # Still works as long as it's not committed yet or we have the data
         
    session.refresh(holding)
    return holding

@router.delete("/{holding_id}")
def delete_holding(
    holding_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a holding."""
    holding = session.get(InvestmentHolding, holding_id)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    account = session.get(Account, holding.account_id)
    if account.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    session.delete(holding)
    session.commit()
    return {"message": "Holding deleted successfully"}

@router.post("/refresh-prices", response_model=List[InvestmentHoldingRead])
def refresh_stock_prices(
    account_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Manually refresh stock prices for all holdings in an account."""
    account = session.get(Account, account_id)
    if not account or account.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account.account_type != AccountType.INVESTMENT:
        raise HTTPException(status_code=400, detail="Only investment accounts have stock holdings")
    
    # Get all holdings for this account
    holdings = session.exec(
        select(InvestmentHolding).where(InvestmentHolding.account_id == account_id)
    ).all()
    
    if not holdings:
        return []
    
    # Build list of symbols with exchange suffix
    symbols = []
    for holding in holdings:
        symbol = holding.symbol
        if holding.stock_exchange:
            symbol = f"{symbol}{holding.stock_exchange}"
        elif '.' not in symbol:  # Add default exchange if needed
            exchange_suffix = get_exchange_suffix(holding.currency)
            if exchange_suffix:
                symbol = f"{symbol}{exchange_suffix}"
        symbols.append(symbol)
    
    # Batch fetch prices
    prices = get_stock_prices_batch(symbols)
    
    # Update holdings with new prices
    now = datetime.utcnow()
    for holding, symbol in zip(holdings, symbols):
        if symbol in prices and prices[symbol] is not None:
            holding.current_price = prices[symbol]
            holding.last_price_update = now
            session.add(holding)
    
    session.commit()
    
    # Refresh all holdings to get updated data
    for holding in holdings:
        session.refresh(holding)
    
    return holdings

