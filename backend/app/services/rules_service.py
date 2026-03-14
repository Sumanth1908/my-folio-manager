import logging
from typing import Optional
from datetime import datetime, timezone, time
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from sqlmodel import Session, select, func

from app.models.account import Account, AccountType
from app.models.loan_account import LoanAccount
from app.models.savings_account import SavingsAccount
from app.models.fixed_deposit_account import FixedDepositAccount
from app.models.rule import Frequency, Rule, RuleType
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, TransferRequest
from app.schemas.rule import RuleCreate, RuleRead, RuleUpdate
from app.services.transaction_service import (create_transaction_core,
                                              create_transfer_core)

logger = logging.getLogger(__name__)

def make_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def calculate_average_daily_balance(session: Session, account: Account, start_date: datetime, end_date: datetime) -> Decimal:
    """
    Calculate the average daily balance for an account over a specific date range.
    Reconstructs balance day-by-day to handle transactions occurring during the period.
    """
    from app.services.account_service import calculate_account_balance
    
    start_date = make_aware(start_date)
    end_date = make_aware(end_date)
    
    # 1. Get initial balance at the very start of the range
    # We do this by summing all transactions BEFORE start_date
    from app.models.loan_account import LoanAccount
    
    base_balance = Decimal("0.00")
    if account.account_type == AccountType.LOAN:
        loan = session.get(LoanAccount, account.account_id)
        if loan:
            base_balance = loan.loan_amount

    # Sum transactions before start_date
    pre_credits = session.exec(
        select(func.sum(Transaction.amount))
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_type == TransactionType.CREDIT,
            Transaction.transaction_date < start_date.replace(tzinfo=None)
        )
    ).one() or Decimal("0.00")
    
    pre_debits = session.exec(
        select(func.sum(Transaction.amount))
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_type == TransactionType.DEBIT,
            Transaction.transaction_date < start_date.replace(tzinfo=None)
        )
    ).one() or Decimal("0.00")
    
    if account.account_type == AccountType.LOAN:
        current_balance = base_balance + pre_debits - pre_credits
    else:
        current_balance = pre_credits - pre_debits

    # 2. Get all transactions occurring WITHIN the range
    transactions = session.exec(
        select(Transaction)
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_date >= start_date.replace(tzinfo=None),
            Transaction.transaction_date <= end_date.replace(tzinfo=None)
        )
        .order_by(Transaction.transaction_date.asc())
    ).all()

    # 3. Iterate through each day in the range and calculate daily balances
    total_days = (end_date - start_date).days
    if total_days <= 0:
        return current_balance

    daily_balances_sum = Decimal("0.00")
    tx_ptr = 0
    num_tx = len(transactions)
    
    # We'll calculate balance at the end of each day
    current_day = start_date
    for _ in range(total_days):
        day_boundary = current_day + relativedelta(days=1)
        
        # Apply all transactions that happened on this specific day
        while tx_ptr < num_tx and make_aware(transactions[tx_ptr].transaction_date) < day_boundary:
            tx = transactions[tx_ptr]
            amount = tx.amount
            if tx.transaction_type == TransactionType.CREDIT:
                if account.account_type == AccountType.LOAN:
                    current_balance -= amount
                else:
                    current_balance += amount
            else: # DEBIT
                if account.account_type == AccountType.LOAN:
                    current_balance += amount
                else:
                    current_balance -= amount
            tx_ptr += 1
        
        daily_balances_sum += current_balance
        current_day = day_boundary

    return daily_balances_sum / Decimal(str(total_days))

def process_single_rule(session: Session, rule: Rule):
    """Execute the logic for a single automation or calculation rule."""
    
    account = session.get(Account, rule.account_id)
    if not account:
        logger.error(f"Account {rule.account_id} not found for rule {rule.rule_id}")
        return
    user_id = account.user_id

    # Calculate days to process
    now_utc = datetime.now(timezone.utc)
    due_at = make_aware(rule.next_run_at) or now_utc
    
    # Infer the start of the current period based on frequency
    # We subtract the frequency interval from the intended due date
    if rule.frequency == Frequency.DAILY:
        period_start = due_at - relativedelta(days=1)
    elif rule.frequency == Frequency.WEEKLY:
        period_start = due_at - relativedelta(weeks=1)
    elif rule.frequency == Frequency.MONTHLY:
        period_start = due_at - relativedelta(months=1)
    elif rule.frequency == Frequency.YEARLY:
        period_start = due_at - relativedelta(years=1)
    else:
        period_start = due_at - relativedelta(days=1) # Fallback

    # days_to_post is the duration of this specific scheduled period.
    # By using due_at instead of now_utc, we ensure that catch-up runs happen 
    # interval-by-interval rather than lumping months of interest together.
    period_end = due_at
    delta = period_end - period_start
    days_to_post = max(1, delta.days)

    description = f"Auto: {rule.name}"
    
    # Construct structured additional info
    info_parts = []
    if rule.rule_type == RuleType.CALCULATION and rule.formula:
        info_parts.append(f"Formula: {rule.formula}")
    
    if days_to_post > 0:
        start_str = period_start.strftime('%Y-%m-%d')
        end_str = period_end.strftime('%Y-%m-%d')
        info_parts.append(f"Period: {start_str} to {end_str} ({days_to_post} days)")
    
    additional_info = " | ".join(info_parts) if info_parts else None
    
    # Use the rule's next_run_at (or now) as the transaction date
    transaction_date = make_aware(rule.next_run_at) or now_utc
    
    transaction_amount = rule.transaction_amount or Decimal("0.00")
    if rule.transaction_amount:
        # If it's a fixed amount rule, multiply by days only if it was originally intended as daily 
        # (Automation rules usually aren't daily interest, but if they are, we scale them)
        if rule.frequency == Frequency.DAILY:
            transaction_amount *= Decimal(str(days_to_post))
    
    # Handle CALCULATION rules (Formula based)
    if rule.rule_type == RuleType.CALCULATION and rule.formula:
        try:
            from app.core.expression_engine import SafeEquationEvaluator
            from app.services.account_service import calculate_account_balance
            
            # Build context
            # We use AVERAGE Daily Balance for accurate interest calculation
            # Use period_end (due_at) for accurate scheduled period calculation
            avg_balance = calculate_average_daily_balance(session, account, period_start, period_end)
            
            context = {
                "balance": float(avg_balance),
                "days": float(days_to_post),
                "interest_rate": float(0.0),
                "principal_amount": float(0.0),
                "outstanding_amount": float(0.0),
                "loan_amount": float(0.0)
            }
            
            # Enrich context based on account type
            if account.account_type == AccountType.SAVINGS:
                savings = session.get(SavingsAccount, rule.account_id)
                if savings:
                    context["interest_rate"] = float(savings.interest_rate or 0.0)
                    context["min_balance"] = float(savings.min_balance or 0.0)
            
            elif account.account_type == AccountType.LOAN:
                loan = session.get(LoanAccount, rule.account_id)
                if loan:
                    context["outstanding_amount"] = float(loan.outstanding_amount) 
                    context["principal_balance"] = float(loan.principal_balance)
                    context["interest_balance"] = float(loan.interest_balance)
                    context["loan_amount"] = float(loan.loan_amount)
                    context["interest_rate"] = float(loan.interest_rate)
                    
            elif account.account_type == AccountType.FIXED_DEPOSIT:
                fd = session.get(FixedDepositAccount, rule.account_id)
                if fd:
                    context["principal_amount"] = float(fd.principal_amount)
                    context["interest_rate"] = float(fd.interest_rate)
            
            # Evaluate formula safely
            evaluator = SafeEquationEvaluator()
            calculated_value = evaluator.evaluate(rule.formula, context)
            transaction_amount = Decimal(str(calculated_value)).quantize(Decimal("0.01"))
            
            logger.info(f"Rule {rule.rule_id} calculated amount: {transaction_amount} using formula: {rule.formula}")
            
        except Exception as e:
            logger.error(f"Failed to evaluate formula for rule {rule.rule_id}: {e}")
            raise e

    # Check if it's a transfer
    if rule.target_account_id:
        transfer_request = TransferRequest(
            from_account_id=rule.account_id,
            to_account_id=rule.target_account_id,
            amount=transaction_amount,
            description=description,
            additional_info=additional_info,
            category_id=rule.category_id,
            transaction_date=transaction_date
        )
        try:
            logger.info(f"Executing transfer for rule {rule.rule_id}")
            create_transfer_core(session, transfer_request, user_id)
        except Exception as e:
            logger.error(f"Failed to create transfer for rule {rule.rule_id}: {e}")
            raise e
    else:
        # Standard Transaction
        tx_create = TransactionCreate(
            account_id=rule.account_id,
            amount=transaction_amount,
            transaction_type=rule.transaction_type,
            description=description,
            additional_info=additional_info,
            category_id=rule.category_id,
            transaction_date=transaction_date
        )
        try:
            logger.info(f"Executing transaction for rule {rule.rule_id}")
            create_transaction_core(session, tx_create, user_id)
        except Exception as e:
            logger.error(f"Failed to create transaction for rule {rule.rule_id}: {e}")
            raise e

    # 3. Schedule Next Run
    if rule.frequency == Frequency.ONE_TIME:
        rule.is_active = False
        rule.next_run_at = None
    else:
        # Calculate next date
        current_run = make_aware(rule.next_run_at) or datetime.now(timezone.utc)
        
        if rule.frequency == Frequency.DAILY:
            rule.next_run_at = current_run + relativedelta(days=1) if now_utc <= current_run else now_utc + relativedelta(days=1)
        elif rule.frequency == Frequency.WEEKLY:
            rule.next_run_at = current_run + relativedelta(weeks=1)
        elif rule.frequency == Frequency.MONTHLY:
            next_date = current_run + relativedelta(months=1)
            
            if rule.rule_type == RuleType.CALCULATION:
                # Align interest calculation to the specific accrual day of the account
                accrual_day = 1
                if account.account_type == AccountType.SAVINGS:
                    savings = session.get(SavingsAccount, account.account_id)
                    if savings: accrual_day = savings.interest_accrual_day or 1
                elif account.account_type == AccountType.LOAN:
                    loan = session.get(LoanAccount, account.account_id)
                    if loan: accrual_day = loan.interest_accrual_day or 1

                # Snap to the correct day for interest
                rule.next_run_at = next_date.replace(day=accrual_day)
            else:
                # For standard transaction rules, just move to the same day next month
                rule.next_run_at = next_date
        elif rule.frequency == Frequency.YEARLY:
           rule.next_run_at = current_run + relativedelta(years=1)

        # Handle rule expiration
        if rule.end_date and rule.next_run_at:
            # We use make_aware to ensure comparison works
            end_dt = make_aware(rule.end_date)
            next_dt = make_aware(rule.next_run_at)
            
            if next_dt >= end_dt:
                rule.is_active = False
                rule.next_run_at = None
                logger.info(f"Rule {rule.rule_id} has expired and is now inactive.")
            
    session.add(rule)
    session.commit()
    session.refresh(rule)

def enrich_rule(session: Session, rule: Rule) -> RuleRead:
    """Helper to attach category details to rule response."""
    rule_dict = rule.model_dump()
    if rule.category_id:
        category = session.get(Category, rule.category_id)
        if category:
            rule_dict['category_name'] = category.name            
    return RuleRead.model_validate(rule_dict)

def get_rules(session: Session, user_id: str, account_id: str = None):
    """Get all rules for a user, optionally filtered by account."""
    query = select(Rule).join(Account, Rule.account_id == Account.account_id).where(Account.user_id == user_id)
    if account_id:
        query = query.where(Rule.account_id == account_id)
    return session.exec(query).all()

def get_rule_with_ownership(session: Session, rule_id: int, user_id: str):
    """Get a rule if it belongs to the user."""
    return session.exec(
        select(Rule)
        .join(Account, Rule.account_id == Account.account_id)
        .where(Rule.rule_id == rule_id)
        .where(Account.user_id == user_id)
    ).first()

def create_rule(session: Session, rule_in: RuleCreate, user_id: str):
    """Create a new rule after verifying account ownership."""
    account = session.get(Account, rule_in.account_id)
    if not account or account.user_id != user_id:
        return None
        
    rule = Rule.model_validate(rule_in)
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule

def update_rule(session: Session, rule_id: int, rule_update: RuleUpdate, user_id: str):
    """Update a rule if it belongs to the user."""
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        return None
        
    rule_data = rule_update.model_dump(exclude_unset=True)
    for key, value in rule_data.items():
        setattr(rule, key, value)
        
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule

def delete_rule(session: Session, rule_id: int, user_id: str):
    """Delete a rule if it belongs to the user."""
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        return False
        
    session.delete(rule)
    session.commit()
    return True

def execute_rule_now_core(session: Session, rule_id: int, user_id: str):
    """Manually execute a rule if it belongs to the user and is of a supported type."""
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        raise ValueError("Rule not found")
        
    if rule.rule_type not in [RuleType.TRANSACTION, RuleType.CALCULATION]:
        raise ValueError("Only transaction or calculation rules can be manually executed.")

    process_single_rule(session, rule)
    session.commit()
    session.refresh(rule)
    return rule

def create_default_interest_rule(session: Session, account: Account, savings_data=None, loan_data=None, fd_data=None):
    """Automatically create a default interest rule for supported account types."""
    if not account.is_interest_enabled:
        return None

    from app.models.transaction import TransactionType
    
    rule_name = f"Daily Interest - {account.account_name}"
    formula = ""
    tx_type = TransactionType.CREDIT
    
    if account.account_type == AccountType.SAVINGS and savings_data:
        formula = "balance * (interest_rate / 100) / 365 * days"
    elif account.account_type == AccountType.LOAN and loan_data:
        formula = "balance * (interest_rate / 100) / 12"
        tx_type = TransactionType.DEBIT
    elif account.account_type == AccountType.FIXED_DEPOSIT and fd_data:
        formula = "principal_amount * (interest_rate / 100) / 365 * days"
        
    if not formula:
        return None

    # Calculate base date for scheduling
    # For Monthly interest, we usually run it at the end of the first month
    if loan_data and hasattr(loan_data, 'emi_start_date') and loan_data.emi_start_date:
        next_run = datetime.combine(loan_data.emi_start_date, time(1, 0), tzinfo=timezone.utc)
    else:
        if loan_data and hasattr(loan_data, 'start_date') and loan_data.start_date:
            base_date = datetime.combine(loan_data.start_date, time(1, 0), tzinfo=timezone.utc)
        elif fd_data and hasattr(fd_data, 'start_date') and fd_data.start_date:
            base_date = datetime.combine(fd_data.start_date, time(1, 0), tzinfo=timezone.utc)
        else:
            base_date = datetime.now(timezone.utc).replace(hour=1, minute=0, second=0, microsecond=0)

        # First run starts one month from base_date
        next_run = base_date + relativedelta(months=1)
        
    interest_rule = session.exec(
        select(Rule)
        .where(Rule.account_id == account.account_id)
        .where(Rule.rule_type == RuleType.CALCULATION)
        .where((Rule.name.like("Monthly Interest - %")) | (Rule.name.like("Daily Interest - %")))
    ).first()

    # Calculate end_date based on tenure or maturity
    end_date = None
    if loan_data and hasattr(loan_data, 'tenure_months') and loan_data.tenure_months and hasattr(loan_data, 'start_date') and loan_data.start_date:
        # Use relivedelta to add tenure to start_date
        start_date_aware = datetime.combine(loan_data.start_date, datetime.min.time(), tzinfo=timezone.utc)
        end_date = start_date_aware + relativedelta(months=loan_data.tenure_months)
    elif fd_data and hasattr(fd_data, 'maturity_date') and fd_data.maturity_date:
        end_date = datetime.combine(fd_data.maturity_date, datetime.min.time(), tzinfo=timezone.utc)

    if interest_rule:
        interest_rule.name = rule_name
        interest_rule.formula = formula
        interest_rule.frequency = Frequency.MONTHLY
        interest_rule.transaction_type = tx_type
        # If converting, ensure next_run is aligned to the new monthly schedule
        if interest_rule.next_run_at is None:
            interest_rule.next_run_at = next_run
        interest_rule.end_date = end_date
        session.add(interest_rule)
    else:
        interest_rule = Rule(
            account_id=account.account_id,
            name=rule_name,
            rule_type=RuleType.CALCULATION,
            formula=formula,
            frequency=Frequency.MONTHLY,
            transaction_type=tx_type,
            next_run_at=next_run,
            end_date=end_date,
            is_active=True
        )
        session.add(interest_rule)
    
    return interest_rule
