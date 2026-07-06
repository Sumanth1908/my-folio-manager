from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlmodel import Session, func, select

from app.models import Account, AccountType, Transaction
from app.models.investment_holding import InvestmentHolding
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate
from app.services import rules_service

def calculate_account_balance(session: Session, account: Account) -> Decimal:
    """Calculate balance dynamically based on transactions."""
    
    # Base balance is now stored in metadata if applicable
    base_balance = Decimal("0.00")
    if account.account_type == AccountType.LOAN and account.metadata_:
        base_balance = Decimal(str(account.metadata_.get("loan_amount", "0.00")))
        
    total = session.exec(
        select(func.sum(Transaction.amount)).where(Transaction.account_id == account.account_id)
    ).one() or Decimal("0.00")
    
    if account.account_type == AccountType.LOAN:
        return -base_balance + total  # total includes deposits (credits) minus withdrawals (debits)
    return total

def get_balances_for_accounts(session: Session, accounts: List[Account]) -> dict:
    """Balances for many accounts in ONE grouped query instead of one SUM per account."""
    account_ids = [a.account_id for a in accounts]
    if not account_ids:
        return {}

    rows = session.exec(
        select(Transaction.account_id, func.sum(Transaction.amount))
        .where(Transaction.account_id.in_(account_ids))
        .group_by(Transaction.account_id)
    ).all()
    sums = {account_id: total or Decimal("0.00") for account_id, total in rows}

    balances = {}
    for account in accounts:
        total = sums.get(account.account_id, Decimal("0.00"))
        if account.account_type == AccountType.LOAN:
            base = Decimal(str((account.metadata_ or {}).get("loan_amount", "0.00")))
            balances[account.account_id] = -base + total
        else:
            balances[account.account_id] = total
    return balances

def enrich_account(session: Session, account: Account, balance: Optional[Decimal] = None) -> AccountRead:
    account_dict = account.model_dump()

    # Calculate real-time balance (callers listing many accounts pass a
    # precomputed balance from get_balances_for_accounts to avoid N+1 queries)
    account_dict['balance'] = balance if balance is not None else calculate_account_balance(session, account)

    if account.account_type == AccountType.INVESTMENT:
        holdings = session.exec(select(InvestmentHolding).where(InvestmentHolding.account_id == account.account_id)).all()
        account_dict['investment_holdings'] = [h.model_dump() for h in holdings]

    return AccountRead.model_validate(account_dict)

def get_account_with_ownership(session: Session, account_id: str, user_id: str) -> Optional[Account]:
    account = session.get(Account, account_id)
    if account and account.user_id == user_id:
        return account
    return None

def get_accounts(session: Session, user_id: str, skip: int = 0, limit: int = 100):
    base_query = select(Account).where(Account.user_id == user_id)
    total = session.exec(select(func.count()).select_from(base_query.subquery())).one()
    accounts = session.exec(base_query.offset(skip).limit(limit)).all()
    return accounts, total

def create_account(session: Session, account_in: AccountCreate, user_id: str) -> Account:
    """Create an account with its funding transaction and automation rules in
    ONE database transaction — a failure at any step leaves nothing behind
    instead of a half-provisioned account."""
    account = Account(**account_in.model_dump(), user_id=user_id)
    session.add(account)
    session.flush()

    if account.account_type == AccountType.FIXED_DEPOSIT and account.metadata_:
        principal = Decimal(str(account.metadata_.get("principal_amount", "0.00")))
        start_date = account.metadata_.get("start_date")
        fund_principal = account.metadata_.get("fund_principal", False)
        linked_account_id = account.metadata_.get("linked_account_id")

        if principal > 0:
            if fund_principal and linked_account_id:
                from app.schemas.transaction import TransferRequest
                from app.services.transaction_service import create_transfer_core
                transfer_req = TransferRequest(
                    from_account_id=linked_account_id,
                    to_account_id=account.account_id,
                    amount=principal,
                    description="FD Principal Funding",
                    transaction_date=datetime.fromisoformat(start_date) if start_date else None
                )
                create_transfer_core(session, transfer_req, user_id, commit=False)
            else:
                initial_tx = Transaction(
                    account_id=account.account_id,
                    amount=principal,
                    currency=account.currency,
                    description="Opening Principal",
                    transaction_date=start_date
                )
                session.add(initial_tx)

    if account.is_interest_enabled:
        rules_service.create_default_interest_rule(session, account)

    if account.account_type == AccountType.RECURRING_DEPOSIT:
        rules_service.create_rd_auto_deposit_rule(session, account)

    if account.account_type == AccountType.LOAN:
        rules_service.create_loan_auto_debit_rule(session, account)

    session.commit()
    session.refresh(account)
    return account

def update_account(session: Session, account_id: str, account_in: AccountUpdate, user_id: str) -> Optional[Account]:
    account = get_account_with_ownership(session, account_id, user_id)
    if not account:
        return None
        
    for key, value in account_in.model_dump(exclude_unset=True).items():
        setattr(account, key, value)

    session.add(account)
    session.commit()
    session.refresh(account)
    return account

def close_account(session: Session, account_id: str, user_id: str, source_account_id: Optional[str] = None) -> Account:
    account = get_account_with_ownership(session, account_id, user_id)
    if not account:
        raise ValueError("Account not found")

    if account.status == "Closed":
        raise ValueError("Account is already closed")

    if account.account_type == AccountType.LOAN:
        balance = calculate_account_balance(session, account)
        if balance < 0:
            outstanding = -balance
            from app.schemas.transaction import TransactionCreate, TransferRequest
            from app.services.transaction_service import create_transaction_core, create_transfer_core

            if source_account_id:
                source_account = get_account_with_ownership(session, source_account_id, user_id)
                if not source_account:
                    raise ValueError("Source account not found")
                if source_account.account_type != AccountType.SAVINGS:
                    raise ValueError("Loan payoff can only be settled from a savings account")
                if source_account.currency != account.currency:
                    raise ValueError("Source account currency must match the loan account currency")

                create_transfer_core(
                    session,
                    TransferRequest(
                        from_account_id=source_account_id,
                        to_account_id=account_id,
                        amount=outstanding,
                        description="Loan Closure Payoff"
                    ),
                    user_id
                )
            else:
                create_transaction_core(
                    session,
                    TransactionCreate(
                        account_id=account_id,
                        amount=outstanding,
                        description="Loan Closure Payoff (Cash/External)"
                    ),
                    user_id
                )
            session.refresh(account)

    account.status = "Closed"
    session.add(account)

    # Stop any pending automation from continuing to post. This must include
    # rules OWNED BY OTHER ACCOUNTS that reference this one (e.g. an RD
    # auto-deposit rule lives on the linked savings account).
    from app.models.rule import Rule
    user_rules = session.exec(
        select(Rule).join(Account, Rule.account_id == Account.account_id)
        .where(Account.user_id == user_id, Rule.is_active == True)
    ).all()
    for rule in user_rules:
        config = rule.configuration or {}
        references_account = (
            rule.account_id == account_id
            or config.get("source_account_id") == account_id
            or config.get("target_account_id") == account_id
        )
        if references_account:
            rule.is_active = False
            rule.next_run_at = None
            session.add(rule)

    session.commit()
    session.refresh(account)
    return account

def delete_account(session: Session, account_id: str, user_id: str) -> bool:
    account = get_account_with_ownership(session, account_id, user_id)
    if not account:
        return False
        
    # 1. Clean up transfer counterpart transactions
    transfers = session.exec(select(Transaction).where(Transaction.account_id == account_id, Transaction.transfer_id.is_not(None))).all()
    transfer_ids = [t.transfer_id for t in transfers if t.transfer_id]
    if transfer_ids:
        counterparts = session.exec(select(Transaction).where(Transaction.transfer_id.in_(transfer_ids))).all()
        for tx in counterparts:
            session.delete(tx)
            
    # 2. Clean up rules that reference this account in their configuration
    from app.models.rule import Rule
    user_rules = session.exec(select(Rule).join(Account).where(Account.user_id == user_id)).all()
    for rule in user_rules:
        if rule.configuration:
            if rule.configuration.get("source_account_id") == account_id or rule.configuration.get("target_account_id") == account_id:
                session.delete(rule)
                
    # 3. Clean up RD accounts that link to this account
    user_accounts = session.exec(select(Account).where(Account.user_id == user_id)).all()
    for acc in user_accounts:
        if acc.account_type == AccountType.RECURRING_DEPOSIT and acc.metadata_ and acc.metadata_.get("linked_account_id") == account_id:
            # We don't delete the RD account, but we remove the link so it doesn't break.
            # Copy the dict: in-place mutation never marks the JSON column dirty.
            new_metadata = dict(acc.metadata_)
            new_metadata["linked_account_id"] = None
            acc.metadata_ = new_metadata
            session.add(acc)

    session.delete(account)
    session.commit()
    return True
