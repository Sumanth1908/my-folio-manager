from decimal import Decimal, ROUND_HALF_UP
from sqlmodel import Session, select

from app.models.account import Account
from app.models.investment_holding import InvestmentHolding
from app.models.settings import Settings
from app.schemas.portfolio import PortfolioSummaryResponse, AccountPortfolioSummary, HoldingSummary
from app.services.account_types import get_account_type_definition


def get_portfolio_summary(session: Session, user_id: str) -> PortfolioSummaryResponse:
    """Calculate the complete portfolio summary for a user."""
    # Get user's default currency from settings
    settings = session.exec(
        select(Settings).where(Settings.user_id == user_id)
    ).first()
    default_currency = settings.default_currency if settings else "USD"
    
    # Holdings are supported by several account types (brokerage, commodities,
    # crypto, real estate, and user-defined types with the capability enabled).
    accounts = session.exec(
        select(Account).where(Account.user_id == user_id)
    ).all()
    accounts = [
        account
        for account in accounts
        if get_account_type_definition(account.account_type, account.metadata_).supports_holdings
    ]
    
    account_summaries = []
    total_value = Decimal("0")
    total_cost = Decimal("0")
    
    for account in accounts:
        # Get holdings for this account
        holdings = session.exec(
            select(InvestmentHolding).where(
                InvestmentHolding.account_id == account.account_id
            )
        ).all()
        
        if not holdings:
            continue
        
        account_value = Decimal("0")
        account_cost = Decimal("0")
        holding_summaries = []
        
        for holding in holdings:
            # Use current price if available, otherwise average price
            current_price = holding.current_price or holding.average_price
            quantity = holding.quantity
            
            current_value = quantity * current_price
            cost_basis = quantity * holding.average_price
            profit_loss = current_value - cost_basis
            profit_loss_percent = (profit_loss / cost_basis * 100) if cost_basis > 0 else Decimal("0")
            
            account_value += current_value
            account_cost += cost_basis
            
            holding_summaries.append(HoldingSummary(
                symbol=holding.symbol,
                name=holding.name,
                quantity=quantity,
                current_price=current_price,
                current_value=current_value,
                cost_basis=cost_basis.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                profit_loss=profit_loss.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                profit_loss_percent=profit_loss_percent.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
                currency=holding.currency,
                asset_type=holding.asset_type,
                unit=holding.unit,
            ))
        
        # Calculate account totals
        account_profit_loss = (account_value - account_cost).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        account_profit_loss_percent = ((account_profit_loss / account_cost * 100) if account_cost > 0 else Decimal("0")).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        total_value += account_value
        total_cost += account_cost
        
        account_summaries.append(AccountPortfolioSummary(
            account_id=account.account_id,
            account_name=account.account_name or "Asset Account",
            currency=account.currency,
            account_type=account.account_type,
            total_value=account_value,
            total_cost=account_cost,
            total_profit_loss=account_profit_loss,
            total_profit_loss_percent=account_profit_loss_percent,
            holdings=holding_summaries
        ))
    
    # Calculate total portfolio metrics
    total_profit_loss = (total_value - total_cost).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    total_profit_loss_percent = ((total_profit_loss / total_cost * 100) if total_cost > 0 else Decimal("0")).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    return PortfolioSummaryResponse(
        accounts=account_summaries,
        total_value_default_currency=total_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        total_cost_default_currency=total_cost.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        total_profit_loss_default_currency=total_profit_loss,
        total_profit_loss_percent=total_profit_loss_percent,
        default_currency=default_currency
    )
