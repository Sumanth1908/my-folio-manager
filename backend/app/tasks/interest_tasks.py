"""
Celery tasks for interest accrual on accounts.
"""
import logging
from datetime import datetime, timezone
from decimal import Decimal

from celery import shared_task
from sqlmodel import Session, select

from app.core.database import engine
from app.models.account import Account
from app.models.fixed_deposit_account import FixedDepositAccount
from app.models.loan_account import LoanAccount
from app.models.savings_account import SavingsAccount
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate
from app.services.account_service import calculate_account_balance
from app.services.transaction_service import create_transaction_core

logger = logging.getLogger(__name__)


@shared_task(name="app.tasks.interest_tasks.process_daily_interest_accruals")
def process_daily_interest_accruals():
    """
    Daily task that processes interest accrual for accounts whose interest_accrual_day matches today.
    
    This task runs daily and checks all accounts. For each account where the interest_accrual_day
    matches the current day of the month, it calculates and applies the monthly interest.
    
    Returns:
        dict: Summary of processed accounts and total interest applied
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today = now.day
    
    processed_loans = 0
    processed_savings = 0
    total_loan_interest = Decimal("0.00")
    total_savings_interest = Decimal("0.00")
    
    logger.info(f"Starting daily interest accrual check for day {today}")
    
    try:
        with Session(engine) as session:
            # Process loan accounts
            loan_stmt = select(Account, LoanAccount).join(
                LoanAccount, Account.account_id == LoanAccount.account_id
            ).where(
                Account.account_type == AccountType.LOAN,
                Account.status == "Active",
                LoanAccount.interest_accrual_day == today
            )
            
            loan_results = session.exec(loan_stmt).all()
            
            for account, loan in loan_results:
                try:
                    interest = accrue_loan_interest(session, account, loan)
                    if interest > 0:
                        processed_loans += 1
                        total_loan_interest += interest
                except Exception as e:
                    logger.error(f"Error processing loan {account.account_id}: {str(e)}")
            
            # Process savings accounts
            savings_stmt = select(Account, SavingsAccount).join(
                SavingsAccount, Account.account_id == SavingsAccount.account_id
            ).where(
                Account.account_type == AccountType.SAVINGS,
                Account.status == "Active",
                SavingsAccount.interest_accrual_day == today,
                SavingsAccount.interest_rate.isnot(None),
                SavingsAccount.interest_rate > 0
            )
            
            savings_results = session.exec(savings_stmt).all()
            
            for account, savings in savings_results:
                try:
                    interest = accrue_savings_interest(session, account, savings)
                    if interest > 0:
                        processed_savings += 1
                        total_savings_interest += interest
                except Exception as e:
                    logger.error(f"Error processing savings {account.account_id}: {str(e)}")

            # Process Fixed Deposit accounts
            fd_stmt = select(Account, FixedDepositAccount).join(
                FixedDepositAccount, Account.account_id == FixedDepositAccount.account_id
            ).where(
                Account.account_type == AccountType.FIXED_DEPOSIT,
                Account.status == "Active",
                FixedDepositAccount.interest_accrual_day == today
            )
            
            fd_results = session.exec(fd_stmt).all()
            processed_fds = 0
            total_fd_interest = Decimal("0.00")
            
            for account, fd in fd_results:
                try:
                    interest = accrue_fd_interest(session, account, fd)
                    if interest > 0:
                        processed_fds += 1
                        total_fd_interest += interest
                except Exception as e:
                    logger.error(f"Error processing FD {account.account_id}: {str(e)}")
            
            # Commit all changes
            session.commit()
            
            logger.info(
                f"Daily interest accrual completed. "
                f"Processed {processed_loans} loans ({total_loan_interest}), "
                f"{processed_savings} savings ({total_savings_interest}), "
                f"{processed_fds} FDs ({total_fd_interest})"
            )
            
            return {
                "success": True,
                "day": today,
                "loans_processed": processed_loans,
                "savings_processed": processed_savings,
                "fds_processed": processed_fds,
                "total_loan_interest": float(total_loan_interest),
                "total_savings_interest": float(total_savings_interest),
                "total_fd_interest": float(total_fd_interest),
            }
            
    except Exception as e:
        logger.error(f"Error in daily interest accrual task: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def accrue_loan_interest(session: Session, account: Account, loan: LoanAccount) -> Decimal:
    """
    Calculate and apply interest to a loan account.
    """
    # 1. Get Dynamic Outstanding Balance
    current_outstanding = calculate_account_balance(session, account)
    
    # Skip if outstanding amount is zero or negative (loan paid off)
    if current_outstanding <= 0:
        logger.info(f"Skipping loan {account.account_id} - no outstanding balance")
        return Decimal("0.00")
    
    # Calculate monthly interest: outstanding_amount × (annual_rate / 12 / 100)
    monthly_interest = current_outstanding * (loan.interest_rate / Decimal("12") / Decimal("100"))
    monthly_interest = monthly_interest.quantize(Decimal("0.01"))  # Round to 2 decimal places
    
    if monthly_interest <= 0:
        logger.info(f"Skipping loan {account.account_id} - zero interest calculated")
        return Decimal("0.00")
    
    # Create interest transaction via Service
    tx_create = TransactionCreate(
        account_id=account.account_id,
        amount=monthly_interest,
        transaction_type=TransactionType.DEBIT,
        currency=account.currency,
        description="Monthly Interest Charge",
        transaction_date=datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    )
    
    try:
        create_transaction_core(session, tx_create)
    except Exception as e:
        logger.error(f"Failed to create interest transaction for {account.account_id}: {e}")
        raise e
    
    # NOTE: We do NOT update loan.outstanding_amount manually anymore.
    
    logger.info(
        f"Applied loan interest to {account.account_id} ({account.account_name}): "
        f"{monthly_interest} {account.currency}"
    )
    
    return monthly_interest


def accrue_savings_interest(session: Session, account: Account, savings: SavingsAccount) -> Decimal:
    """
    Calculate and apply interest to a savings account.
    """
    # 1. Get Dynamic Balance
    current_balance = calculate_account_balance(session, account)

    # Skip if balance is zero or negative
    if current_balance <= 0:
        logger.info(f"Skipping savings {account.account_id} - no balance")
        return Decimal("0.00")
    
    # Calculate monthly interest: balance × (annual_rate / 12 / 100)
    monthly_interest = current_balance * (savings.interest_rate / Decimal("12") / Decimal("100"))
    monthly_interest = monthly_interest.quantize(Decimal("0.01"))  # Round to 2 decimal places
    
    if monthly_interest <= 0:
        logger.info(f"Skipping savings {account.account_id} - zero interest calculated")
        return Decimal("0.00")
    
    # Create interest transaction via Service
    tx_create = TransactionCreate(
        account_id=account.account_id,
        amount=monthly_interest,
        transaction_type=TransactionType.CREDIT,
        currency=account.currency,
        description="Monthly Interest Credit",
        transaction_date=datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    )

    try:
        create_transaction_core(session, tx_create)
    except Exception as e:
        logger.error(f"Failed to create interest transaction for {account.account_id}: {e}")
        raise e
    
    # NOTE: We do NOT update savings.balance manually anymore.
    
    logger.info(
        f"Applied savings interest to {account.account_id} ({account.account_name}): "
        f"{monthly_interest} {account.currency}"
    )
    
    return monthly_interest


def accrue_fd_interest(session: Session, account: Account, fd: FixedDepositAccount) -> Decimal:
    """
    Calculate and apply interest to a Fixed Deposit account.
    
    Args:
        session: Database session
        account: Account record
        fd: FixedDepositAccount record
        
    Returns:
        Decimal: Amount of interest accrued
    """
    # Calculate monthly interest on principal: principal_amount × (annual_rate / 12 / 100)
    # Note: FDs typically calculate on principal unless compounding is explicitly tracked in a balance.
    # Here we assume simple monthly interest payout/accrual based on principal.
    monthly_interest = fd.principal_amount * (fd.interest_rate / Decimal("12") / Decimal("100"))
    monthly_interest = monthly_interest.quantize(Decimal("0.01"))  # Round to 2 decimal places
    
    if monthly_interest <= 0:
        logger.info(f"Skipping FD {account.account_id} - zero interest calculated")
        return Decimal("0.00")
    
    # Create interest transaction
    interest_transaction = Transaction(
        account_id=account.account_id,
        amount=monthly_interest,
        transaction_type=TransactionType.CREDIT,
        currency=account.currency,
        description="FD Monthly Interest",
        transaction_date=datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    )
    session.add(interest_transaction)
    
    # We don't update 'principal_amount' as that stays constant.
    # The 'value' of the FD increases via the transactions.
    
    logger.info(
        f"Applied FD interest to {account.account_id} ({account.account_name}): "
        f"{monthly_interest} {account.currency}"
    )
    
    return monthly_interest
