from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import Session, select, col, func

from app.models import Account, Transaction, Category
from app.schemas.summary import SummaryResponse, AccountSummary, CategorySummary


def get_accounts_summary(
    session: Session,
    user_id: str,
    account_types: Optional[List[str]] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None
) -> SummaryResponse:
    """Calculate categorical summary for all accounts of a user."""
    account_query = select(Account).where(Account.user_id == user_id)
    if account_types:
        account_query = account_query.where(col(Account.account_type).in_(account_types))
    
    accounts = session.exec(account_query).all()
    response_accounts = []
    
    for account in accounts:
        tx_query = select(
            Category.name,
            Transaction.transaction_type,
            func.sum(Transaction.amount).label("total")
        ).join(Category, Transaction.category_id == Category.category_id, isouter=True)\
         .where(Transaction.account_id == account.account_id)
        
        if from_date:
            if from_date.tzinfo:
                from_date = from_date.astimezone(timezone.utc).replace(tzinfo=None)
            tx_query = tx_query.where(Transaction.transaction_date >= from_date)
        if to_date:
            if to_date.tzinfo:
                to_date = to_date.astimezone(timezone.utc).replace(tzinfo=None)
            tx_query = tx_query.where(Transaction.transaction_date <= to_date)
            
        tx_query = tx_query.group_by(Category.name, Transaction.transaction_type)
        results = session.exec(tx_query).all()
        
        categories_summary = []
        for cat_name, tx_type, total in results:
            categories_summary.append(CategorySummary(
                name=cat_name or "Uncategorized",
                total_amount=float(total or 0.0),
                transaction_type=tx_type
            ))
            
        response_accounts.append(AccountSummary(
            account_id=account.account_id,
            account_name=account.account_name,
            account_type=account.account_type,
            currency=account.currency,
            categories=categories_summary
        ))
        
    return SummaryResponse(accounts=response_accounts)
