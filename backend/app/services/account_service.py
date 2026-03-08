from decimal import Decimal
from typing import List, Optional
from sqlmodel import Session, func, select

from app.models import Account, AccountType, Transaction, TransactionType
from app.models.fixed_deposit_account import FixedDepositAccount
from app.models.loan_account import LoanAccount
from app.models.savings_account import SavingsAccount
from app.models.investment_holding import InvestmentHolding
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate
from app.services import rules_service


def calculate_account_balance(session: Session, account: Account) -> Decimal:
    """
    Calculate the current balance of an account dynamically based on transactions.
    """
    # 1. Get base balance / principal
    base_balance = Decimal("0.00")
    
    if account.account_type == AccountType.LOAN:
        loan = session.get(LoanAccount, account.account_id)
        if loan:
            base_balance = loan.loan_amount
            
    # 2. Sum up Debits and Credits
    credits = session.exec(
        select(func.sum(Transaction.amount))
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_type == TransactionType.CREDIT
        )
    ).one() or Decimal("0.00")
    
    debits = session.exec(
        select(func.sum(Transaction.amount))
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_type == TransactionType.DEBIT
        )
    ).one() or Decimal("0.00")
    
    if account.account_type == AccountType.LOAN:
        # Outstanding Amount needed
        return base_balance + debits - credits
    else:
        # Standard Balance (Savings, etc.)
        return credits - debits


def enrich_account(session: Session, account: Account) -> AccountRead:
    """Helper to populate nested account details and dynamic balances."""
    account_dict = account.model_dump()
    
    if account.account_type == AccountType.SAVINGS:
        savings = session.get(SavingsAccount, account.account_id)
        if savings:
            savings_dict = savings.model_dump()
            savings_dict['balance'] = calculate_account_balance(session, account)
            account_dict['savings_account'] = savings_dict
            
    elif account.account_type == AccountType.LOAN:
        loan = session.get(LoanAccount, account.account_id)
        if loan:
            loan_dict = loan.model_dump()
            loan_dict['outstanding_amount'] = calculate_account_balance(session, account)
            account_dict['loan_account'] = loan_dict
            
    elif account.account_type == AccountType.FIXED_DEPOSIT:
        fd = session.get(FixedDepositAccount, account.account_id)
        if fd:
            fd_dict = fd.model_dump()
            fd_dict['balance'] = calculate_account_balance(session, account)
            account_dict['fixed_deposit_account'] = fd_dict

    elif account.account_type == AccountType.INVESTMENT:
        holdings_query = select(InvestmentHolding).where(InvestmentHolding.account_id == account.account_id)
        holdings = session.exec(holdings_query).all()
        account_dict['investment_holdings'] = [h.model_dump() for h in holdings]
            
    return AccountRead.model_validate(account_dict)


def get_account_with_ownership(session: Session, account_id: str, user_id: str) -> Optional[Account]:
    """Fetch an account and verify it belongs to the user."""
    account = session.get(Account, account_id)
    if account and account.user_id == user_id:
        return account
    return None


def get_accounts(session: Session, user_id: str, skip: int = 0, limit: int = 100):
    """Get paginated accounts for a user."""
    base_query = select(Account).where(Account.user_id == user_id)
    
    # Count total
    count_query = select(func.count()).select_from(base_query.subquery())
    total = session.exec(count_query).one()
    
    # Apply pagination
    query = base_query.offset(skip).limit(limit)
    accounts = session.exec(query).all()
    
    return accounts, total


def create_account(session: Session, account_in: AccountCreate, user_id: str) -> Account:
    """Create a new account with its specific type details."""
    savings_data = account_in.savings_account
    loan_data = account_in.loan_account
    fd_data = account_in.fixed_deposit_account
    
    account_data = account_in.model_dump(exclude={"savings_account", "loan_account", "fixed_deposit_account"})
    account = Account(**account_data, user_id=user_id)
    
    session.add(account)
    session.commit()
    session.refresh(account)
    
    if account.account_type == AccountType.SAVINGS and savings_data:
        savings_account = SavingsAccount(
            account_id=account.account_id,
            **savings_data.model_dump()
        )
        session.add(savings_account)
        
    elif account.account_type == AccountType.LOAN and loan_data:
        loan_account = LoanAccount(
            account_id=account.account_id,
            **loan_data.model_dump(),
            outstanding_amount=loan_data.loan_amount
        )
        session.add(loan_account)
        
    elif account.account_type == AccountType.FIXED_DEPOSIT and fd_data:
        fd_account = FixedDepositAccount(
            account_id=account.account_id,
            **fd_data.model_dump()
        )
        session.add(fd_account)
        
        initial_transaction = Transaction(
            account_id=account.account_id,
            user_id=user_id,
            amount=fd_account.principal_amount,
            transaction_type=TransactionType.CREDIT,
            currency=account.currency,
            description="Opening Principal",
            transaction_date=fd_account.start_date
        )
        session.add(initial_transaction)

    # Automatically create Interest Rule if enabled
    rules_service.create_default_interest_rule(
        session, account, savings_data, loan_data, fd_data
    )

    session.commit()
    session.refresh(account)
    return account


def update_account(session: Session, account_id: str, account_in: AccountUpdate, user_id: str) -> Optional[Account]:
    """Update an account and its specific details."""
    account = get_account_with_ownership(session, account_id, user_id)
    if not account:
        return None
        
    account_data = account_in.model_dump(exclude_unset=True, exclude={"savings_account", "loan_account", "fixed_deposit_account"})
    for key, value in account_data.items():
        setattr(account, key, value)
    
    if account.account_type == AccountType.SAVINGS and account_in.savings_account:
        savings = session.get(SavingsAccount, account.account_id)
        if savings:
            savings_data = account_in.savings_account.model_dump(exclude_unset=True)
            for key, value in savings_data.items():
                setattr(savings, key, value)
            session.add(savings)
            
    elif account.account_type == AccountType.LOAN and account_in.loan_account:
        loan = session.get(LoanAccount, account.account_id)
        if loan:
            loan_data = account_in.loan_account.model_dump(exclude_unset=True)
            for key, value in loan_data.items():
                setattr(loan, key, value)
            session.add(loan)
            
    elif account.account_type == AccountType.FIXED_DEPOSIT and account_in.fixed_deposit_account:
        fd = session.get(FixedDepositAccount, account.account_id)
        if fd:
            fd_data = account_in.fixed_deposit_account.model_dump(exclude_unset=True)
            for key, value in fd_data.items():
                setattr(fd, key, value)
            session.add(fd)

    session.add(account)
    session.commit()
    session.refresh(account)
    return account


def delete_account(session: Session, account_id: str, user_id: str) -> bool:
    """Delete an account if it belongs to the user."""
    account = get_account_with_ownership(session, account_id, user_id)
    if not account:
        return False
        
    session.delete(account)
    session.commit()
    return True
