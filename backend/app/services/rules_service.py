import logging
from datetime import datetime, timezone
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from sqlmodel import Session, select

from app.models.account import Account, AccountType
from app.models.loan_account import LoanAccount
from app.models.savings_account import SavingsAccount
from app.models.fixed_deposit_account import FixedDepositAccount
from app.models.rule import Frequency, Rule, RuleType
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransferRequest
from app.schemas.rule import RuleCreate, RuleRead, RuleUpdate
from app.services.transaction_service import (create_transaction_core,
                                              create_transfer_core)

logger = logging.getLogger(__name__)

def process_single_rule(session: Session, rule: Rule):
    """Execute the logic for a single automation or calculation rule."""
    
    account = session.get(Account, rule.account_id)
    if not account:
        logger.error(f"Account {rule.account_id} not found for rule {rule.rule_id}")
        return
    user_id = account.user_id

    description = f"Auto: {rule.name}"
    
    # Use the rule's next_run_at as the transaction date
    transaction_date = rule.next_run_at or datetime.now(timezone.utc).replace(tzinfo=None)
    
    transaction_amount = rule.transaction_amount or Decimal("0.00")
    
    # Handle CALCULATION rules (Formula based)
    if rule.rule_type == RuleType.CALCULATION and rule.formula:
        try:
            from app.core.expression_engine import SafeEquationEvaluator
            from app.services.account_service import calculate_account_balance
            
            # Build context
            context = {
                "balance": float(calculate_account_balance(session, account)),
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
                    # For loans, calculate_account_balance returns outstanding amount
                    context["outstanding_amount"] = context["balance"] 
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
        current_run = rule.next_run_at or datetime.now(timezone.utc).replace(tzinfo=None)
        
        if rule.frequency == Frequency.DAILY:
            rule.next_run_at = current_run + relativedelta(days=1)
        elif rule.frequency == Frequency.WEEKLY:
            rule.next_run_at = current_run + relativedelta(weeks=1)
        elif rule.frequency == Frequency.MONTHLY:
            rule.next_run_at = current_run + relativedelta(months=1)
        elif rule.frequency == Frequency.YEARLY:
           rule.next_run_at = current_run + relativedelta(years=1)
            
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
    
    rule_name = f"Monthly Interest - {account.account_name}"
    formula = ""
    tx_type = TransactionType.CREDIT
    accrual_day = 1
    
    if account.account_type == AccountType.SAVINGS and savings_data:
        formula = "balance * (interest_rate / 100) / 12"
        accrual_day = savings_data.interest_accrual_day
    elif account.account_type == AccountType.LOAN and loan_data:
        formula = "outstanding_amount * (interest_rate / 100) / 12"
        tx_type = TransactionType.DEBIT
        accrual_day = loan_data.interest_accrual_day
    elif account.account_type == AccountType.FIXED_DEPOSIT and fd_data:
        formula = "principal_amount * (interest_rate / 100) / 12"
        accrual_day = fd_data.interest_accrual_day
        
    if not formula:
        return None

    # Calculate next run date (first occurrence of accrual_day)
    now = datetime.utcnow()
    if now.day >= accrual_day:
        # Next month
        if now.month == 12:
            next_month = datetime(now.year + 1, 1, accrual_day)
        else:
            next_month = datetime(now.year, now.month + 1, accrual_day)
        next_run = next_month
    else:
        next_run = datetime(now.year, now.month, accrual_day)
        
    interest_rule = Rule(
        account_id=account.account_id,
        name=rule_name,
        rule_type=RuleType.CALCULATION,
        formula=formula,
        frequency=Frequency.MONTHLY,
        transaction_type=tx_type,
        next_run_at=next_run,
        is_active=True
    )
    session.add(interest_rule)
    return interest_rule
