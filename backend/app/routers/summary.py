from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, col
from sqlalchemy import func

from app.core.database import get_session
from app.deps import get_current_user
from app.models import Account, Transaction, Category, Settings
from app.models.user import User
from app.schemas.summary import SummaryResponse, AccountSummary, CategorySummary

router = APIRouter(prefix="/summary", tags=["summary"])

@router.get("/accounts", response_model=SummaryResponse)
def get_accounts_summary(
    account_types: Optional[List[str]] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Fetch relevant accounts
    account_query = select(Account).where(Account.user_id == current_user.user_id)
    if account_types:
        account_query = account_query.where(col(Account.account_type).in_(account_types))
    
    accounts = session.exec(account_query).all()
    
    response_accounts = []
    
    for account in accounts:
        # 2. Query transactions for this account with filters
        tx_query = select(
            Category.name,
            Transaction.transaction_type,
            func.sum(Transaction.amount).label("total")
        ).join(Category, Transaction.category_id == Category.category_id, isouter=True)\
         .where(Transaction.account_id == account.account_id)
        
        if from_date:
            tx_query = tx_query.where(Transaction.transaction_date >= from_date)
        if to_date:
            tx_query = tx_query.where(Transaction.transaction_date <= to_date)
            
        tx_query = tx_query.group_by(Category.name, Transaction.transaction_type)
        
        results = session.exec(tx_query).all()
        
        categories_summary = []
        for cat_name, tx_type, total in results:
            categories_summary.append(CategorySummary(
                name=cat_name or "Uncategorized",
                total_amount=float(total),
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
