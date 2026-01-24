from decimal import Decimal

from sqlmodel import Session, func, select

from app.models import Account, AccountType, Transaction, TransactionType
from app.models.fixed_deposit_account import FixedDepositAccount
from app.models.loan_account import LoanAccount
from app.models.savings_account import SavingsAccount


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
    # Loan: Balance = Principal + Debits (Interest/Fees) - Credits (Payments)
    # Savings: Balance = Credits (Deposits) - Debits (Withdrawals)
    
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
