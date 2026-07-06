from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from sqlmodel import Session, select, col, func
from sqlalchemy import case

from app.models import Account, AccountType, Transaction, Category
from app.models.rule import Rule
from app.schemas.summary import (AccountSummary, CategorySummary, SummaryResponse,
                                 UpcomingItem, UpcomingResponse)


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
    
    tx_type_expr = case(
        (Transaction.amount >= 0, "CREDIT"),
        else_="DEBIT"
    ).label("transaction_type")
    
    for account in accounts:
        tx_query = select(
            Category.name,
            tx_type_expr,
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
            
        tx_query = tx_query.group_by(Category.name, tx_type_expr)
        results = session.exec(tx_query).all()
        
        categories_summary = []
        for cat_name, tx_type, total in results:
            categories_summary.append(CategorySummary(
                name=cat_name or "Uncategorized",
                total_amount=abs(float(total or 0.0)),
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


def get_upcoming(session: Session, user_id: str, days: int = 30) -> UpcomingResponse:
    """Everything scheduled to happen in the next `days`: rule runs (EMIs,
    RD deposits, interest accruals) plus FD/RD maturities."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    horizon = now + timedelta(days=days)
    items: List[UpcomingItem] = []

    accounts = session.exec(select(Account).where(Account.user_id == user_id)).all()
    account_by_id = {a.account_id: a for a in accounts}

    rules = session.exec(
        select(Rule).join(Account, Rule.account_id == Account.account_id)
        .where(
            Account.user_id == user_id,
            Rule.is_active == True,
            Rule.next_run_at != None,
            Rule.next_run_at <= horizon,
        )
    ).all()

    for rule in rules:
        account = account_by_id.get(rule.account_id)
        if not account:
            continue
        config = rule.configuration or {}
        amount = None
        if config.get("transaction_amount"):
            try:
                amount = float(Decimal(str(config["transaction_amount"])))
            except Exception:
                amount = None
        type_key = account.account_type.value if hasattr(account.account_type, "value") else str(account.account_type)
        items.append(UpcomingItem(
            date=rule.next_run_at,
            kind="RULE",
            name=rule.name,
            account_id=account.account_id,
            account_name=account.account_name,
            account_type=type_key,
            amount=amount,
            rule_id=rule.rule_id,
        ))

    for account in accounts:
        if account.status == "Closed" or not account.metadata_:
            continue
        maturity = account.metadata_.get("maturity_date")
        if maturity and account.account_type in (AccountType.FIXED_DEPOSIT, AccountType.RECURRING_DEPOSIT):
            try:
                maturity_dt = datetime.fromisoformat(maturity).replace(tzinfo=None)
            except ValueError:
                continue
            if now <= maturity_dt <= horizon:
                type_key = account.account_type.value if hasattr(account.account_type, "value") else str(account.account_type)
                items.append(UpcomingItem(
                    date=maturity_dt,
                    kind="MATURITY",
                    name=f"{account.account_name} matures",
                    account_id=account.account_id,
                    account_name=account.account_name,
                    account_type=type_key,
                ))

    items.sort(key=lambda item: item.date)
    return UpcomingResponse(items=items)
