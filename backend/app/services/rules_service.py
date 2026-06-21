import logging
from typing import Optional
from datetime import datetime, timezone, time
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from sqlmodel import Session, select, func

from app.models.account import Account, AccountType
from app.models.rule import Rule, RuleType
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransferRequest
from app.schemas.rule import RuleCreate, RuleRead, RuleUpdate
from app.services.transaction_service import (create_transaction_core,
                                              create_transfer_core)
from app.services.rule_strategy import RuleProcessorFactory

logger = logging.getLogger(__name__)

def make_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def calculate_average_daily_balance(session: Session, account: Account, start_date: datetime, end_date: datetime) -> Decimal:
    start_date = make_aware(start_date)
    end_date = make_aware(end_date)
    
    base_balance = Decimal("0.00")
    if account.account_type == AccountType.LOAN and account.metadata_:
        base_balance = Decimal(str(account.metadata_.get("loan_amount", "0.00")))

    # Pre-balance logic (transactions before start_date)
    pre_sum = session.exec(
        select(func.sum(Transaction.amount))
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_date < start_date.replace(tzinfo=None)
        )
    ).one() or Decimal("0.00")
    
    if account.account_type == AccountType.LOAN:
        current_balance = base_balance - pre_sum
    else:
        current_balance = pre_sum

    transactions = session.exec(
        select(Transaction)
        .where(
            Transaction.account_id == account.account_id,
            Transaction.transaction_date >= start_date.replace(tzinfo=None),
            Transaction.transaction_date <= end_date.replace(tzinfo=None)
        )
        .order_by(Transaction.transaction_date.asc())
    ).all()

    total_days = (end_date - start_date).days
    if total_days <= 0:
        return current_balance

    daily_balances_sum = Decimal("0.00")
    tx_ptr = 0
    num_tx = len(transactions)
    
    current_day = start_date
    for _ in range(total_days):
        day_boundary = current_day + relativedelta(days=1)
        
        while tx_ptr < num_tx and make_aware(transactions[tx_ptr].transaction_date) < day_boundary:
            tx = transactions[tx_ptr]
            if account.account_type == AccountType.LOAN:
                current_balance -= tx.amount
            else:
                current_balance += tx.amount
            tx_ptr += 1
        
        daily_balances_sum += current_balance
        current_day = day_boundary

    return daily_balances_sum / Decimal(str(total_days))

def process_single_rule(session: Session, rule: Rule):
    account = session.get(Account, rule.account_id)
    if not account:
        logger.error(f"Account {rule.account_id} not found for rule {rule.rule_id}")
        return
    user_id = account.user_id

    now_utc = datetime.now(timezone.utc)
    due_at = make_aware(rule.next_run_at) or now_utc
    
    config = rule.configuration or {}
    frequency = config.get("frequency")
    
    if frequency == "DAILY":
        period_start = due_at - relativedelta(days=1)
    elif frequency == "WEEKLY":
        period_start = due_at - relativedelta(weeks=1)
    elif frequency == "MONTHLY":
        period_start = due_at - relativedelta(months=1)
    elif frequency == "YEARLY":
        period_start = due_at - relativedelta(years=1)
    else:
        period_start = due_at - relativedelta(days=1)

    period_end = due_at
    delta = period_end - period_start
    days_to_post = max(1, delta.days)

    description = f"Auto: {rule.name}"
    
    info_parts = []
    formula = config.get("formula")
    if rule.rule_type == RuleType.CALCULATION and formula:
        info_parts.append(f"Formula: {formula}")
    
    if days_to_post > 0:
        start_str = period_start.strftime('%Y-%m-%d')
        end_str = period_end.strftime('%Y-%m-%d')
        info_parts.append(f"Period: {start_str} to {end_str} ({days_to_post} days)")
    
    additional_info = " | ".join(info_parts) if info_parts else None
    transaction_date = make_aware(rule.next_run_at) or now_utc
    
    strategy = RuleProcessorFactory.get_strategy(rule.rule_type)
    avg_balance = calculate_average_daily_balance(session, account, period_start, period_end) if rule.rule_type == RuleType.CALCULATION else Decimal("0.00")
    transaction_amount = strategy.evaluate(session, rule, account, avg_balance, days_to_post)

    target_account_id = config.get("target_account_id")
    source_account_id = config.get("source_account_id")
    category_id = config.get("category_id")
    
    if target_account_id or source_account_id:
        from_acc = source_account_id if source_account_id else rule.account_id
        to_acc = target_account_id if target_account_id else rule.account_id
        
        transfer_request = TransferRequest(
            from_account_id=from_acc,
            to_account_id=to_acc,
            amount=transaction_amount,
            description=description,
            additional_info=additional_info,
            category_id=category_id,
            transaction_date=transaction_date
        )
        try:
            create_transfer_core(session, transfer_request, user_id)
        except Exception as e:
            logger.error(f"Failed to create transfer for rule {rule.rule_id}: {e}")
            raise e
    else:
        is_debit = config.get("is_debit", False) or config.get("transaction_type") == "DEBIT"
        transaction_amount = abs(transaction_amount)
        if is_debit:
            transaction_amount = -transaction_amount
            
        tx_create = TransactionCreate(
            account_id=rule.account_id,
            amount=transaction_amount,
            description=description,
            additional_info=additional_info,
            category_id=category_id,
            transaction_date=transaction_date
        )
        try:
            create_transaction_core(session, tx_create, user_id)
        except Exception as e:
            logger.error(f"Failed to create transaction for rule {rule.rule_id}: {e}")
            raise e

    if frequency == "ONE_TIME" or not frequency:
        rule.is_active = False
        rule.next_run_at = None
    else:
        current_run = make_aware(rule.next_run_at) or datetime.now(timezone.utc)
        
        if frequency == "DAILY":
            rule.next_run_at = current_run + relativedelta(days=1) if now_utc <= current_run else now_utc + relativedelta(days=1)
        elif frequency == "WEEKLY":
            rule.next_run_at = current_run + relativedelta(weeks=1)
        elif frequency == "MONTHLY":
            next_date = current_run + relativedelta(months=1)
            
            if rule.rule_type == RuleType.CALCULATION:
                accrual_day = 1
                if account.metadata_:
                    accrual_day = account.metadata_.get("interest_accrual_day")
                    if not accrual_day and account.account_type == AccountType.RECURRING_DEPOSIT:
                        accrual_day = account.metadata_.get("deposit_day")
                    if not accrual_day and account.metadata_.get("start_date"):
                        try:
                            start_dt = datetime.fromisoformat(account.metadata_["start_date"])
                            accrual_day = start_dt.day
                        except ValueError:
                            pass
                    
                    accrual_day = accrual_day or 1
                    
                rule.next_run_at = next_date.replace(day=int(accrual_day))
            else:
                rule.next_run_at = next_date
        elif frequency == "YEARLY":
           rule.next_run_at = current_run + relativedelta(years=1)

        end_date = config.get("end_date")
        if end_date and rule.next_run_at:
            end_dt = make_aware(datetime.fromisoformat(end_date))
            next_dt = make_aware(rule.next_run_at)
            
            if next_dt >= end_dt:
                rule.is_active = False
                rule.next_run_at = None
            
    session.add(rule)
    session.commit()
    session.refresh(rule)

def enrich_rule(session: Session, rule: Rule) -> RuleRead:
    rule_dict = rule.model_dump()
    config = rule.configuration or {}
    category_id = config.get("category_id")
    if category_id:
        category = session.get(Category, category_id)
        if category:
            rule_dict['category_name'] = category.name            
    return RuleRead.model_validate(rule_dict)

def get_rules(session: Session, user_id: str, account_id: str = None):
    query = select(Rule).join(Account, Rule.account_id == Account.account_id).where(Account.user_id == user_id)
    all_user_rules = session.exec(query).all()
    
    if not account_id:
        return all_user_rules
        
    filtered_rules = []
    for rule in all_user_rules:
        if rule.account_id == account_id:
            filtered_rules.append(rule)
            continue
            
        config = rule.configuration or {}
        if config.get("target_account_id") == account_id or config.get("source_account_id") == account_id:
            filtered_rules.append(rule)
            
    return filtered_rules

def get_rule_with_ownership(session: Session, rule_id: int, user_id: str):
    return session.exec(
        select(Rule)
        .join(Account, Rule.account_id == Account.account_id)
        .where(Rule.rule_id == rule_id)
        .where(Account.user_id == user_id)
    ).first()

def create_rule(session: Session, rule_in: RuleCreate, user_id: str):
    account = session.get(Account, rule_in.account_id)
    if not account or account.user_id != user_id:
        return None
        
    rule = Rule.model_validate(rule_in)
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule

def update_rule(session: Session, rule_id: int, rule_update: RuleUpdate, user_id: str):
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
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        return False
        
    session.delete(rule)
    session.commit()
    return True

def execute_rule_now_core(session: Session, rule_id: int, user_id: str):
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
    if not account.is_interest_enabled:
        return None
    
    rule_name = f"Daily Interest - {account.account_name}"
    formula = ""
    is_debit = False
    
    if account.account_type == AccountType.SAVINGS:
        formula = "balance * (interest_rate / 100) / 365 * days"
    elif account.account_type == AccountType.LOAN:
        formula = "balance * (interest_rate / 100) / 12"
        is_debit = True
    elif account.account_type == AccountType.FIXED_DEPOSIT:
        formula = "principal_amount * (interest_rate / 100) / 365 * days"
    elif account.account_type == AccountType.RECURRING_DEPOSIT:
        formula = "balance * (interest_rate / 100) / 365 * days"
        
    if not formula:
        return None

    metadata_ = account.metadata_ or {}
    
    start_date_str = metadata_.get('emi_start_date') or metadata_.get('start_date')
    if start_date_str:
        start_date = datetime.fromisoformat(start_date_str).replace(tzinfo=timezone.utc)
        base_date = datetime.combine(start_date, time(1, 0), tzinfo=timezone.utc)
    else:
        base_date = datetime.now(timezone.utc).replace(hour=1, minute=0, second=0, microsecond=0)

    next_run = base_date + relativedelta(months=1)
        
    interest_rule = session.exec(
        select(Rule)
        .where(Rule.account_id == account.account_id)
        .where(Rule.rule_type == RuleType.CALCULATION)
        .where((Rule.name.like("Monthly Interest - %")) | (Rule.name.like("Daily Interest - %")))
    ).first()

    end_date = None
    if account.account_type == AccountType.LOAN and metadata_.get('tenure_months') and metadata_.get('start_date'):
        start_date_aware = datetime.fromisoformat(metadata_['start_date']).replace(tzinfo=timezone.utc)
        end_date = start_date_aware + relativedelta(months=metadata_['tenure_months'])
    elif account.account_type == AccountType.FIXED_DEPOSIT and metadata_.get('maturity_date'):
        end_date = datetime.fromisoformat(metadata_['maturity_date']).replace(tzinfo=timezone.utc)
    elif account.account_type == AccountType.RECURRING_DEPOSIT and metadata_.get('maturity_date'):
        end_date = datetime.fromisoformat(metadata_['maturity_date']).replace(tzinfo=timezone.utc)

    config = {
        "formula": formula,
        "frequency": "MONTHLY",
        "is_debit": is_debit
    }
    if end_date:
        config["end_date"] = end_date.isoformat()

    if interest_rule:
        interest_rule.name = rule_name
        interest_rule.configuration = config
        if interest_rule.next_run_at is None:
            interest_rule.next_run_at = next_run
        session.add(interest_rule)
    else:
        interest_rule = Rule(
            account_id=account.account_id,
            name=rule_name,
            rule_type=RuleType.CALCULATION,
            configuration=config,
            next_run_at=next_run,
            is_active=True
        )
        session.add(interest_rule)
    
    return interest_rule

def create_rd_auto_deposit_rule(session: Session, rd_account: Account):
    metadata_ = rd_account.metadata_ or {}
    if not metadata_.get("is_auto_deposit") or not metadata_.get("linked_account_id"):
        return None
        
    linked_account_id = metadata_["linked_account_id"]
    deposit_amount = metadata_.get("deposit_amount", 0)
    
    rule_name = f"Auto Deposit - {rd_account.account_name}"
    
    start_date_str = metadata_.get('start_date')
    if start_date_str:
        start_date = datetime.fromisoformat(start_date_str).replace(tzinfo=timezone.utc)
        deposit_day = metadata_.get('deposit_day', start_date.day)
        try:
            # First deposit on the start date
            next_run = datetime.combine(start_date, time(1, 0), tzinfo=timezone.utc)
        except ValueError:
            next_run = datetime.now(timezone.utc)
    else:
        next_run = datetime.now(timezone.utc)

    end_date = None
    if metadata_.get('maturity_date'):
        end_date = datetime.fromisoformat(metadata_['maturity_date']).replace(tzinfo=timezone.utc)

    config = {
        "transaction_amount": str(deposit_amount),
        "frequency": "MONTHLY",
        "target_account_id": rd_account.account_id
    }
    if end_date:
        config["end_date"] = end_date.isoformat()

    deposit_rule = Rule(
        account_id=linked_account_id,
        name=rule_name,
        rule_type=RuleType.TRANSACTION,
        configuration=config,
        next_run_at=next_run,
        is_active=True
    )
    session.add(deposit_rule)
    return deposit_rule

def create_loan_auto_debit_rule(session: Session, loan_account: Account):
    metadata_ = loan_account.metadata_ or {}
    if not metadata_.get("is_auto_debit") or not metadata_.get("linked_account_id"):
        return None
        
    linked_account_id = metadata_["linked_account_id"]
    emi_amount = metadata_.get("emi_amount", 0)
    
    rule_name = f"Auto Debit - {loan_account.account_name}"
    
    start_date_str = metadata_.get('emi_start_date') or metadata_.get('start_date')
    if start_date_str:
        start_date = datetime.fromisoformat(start_date_str).replace(tzinfo=timezone.utc)
        try:
            next_run = datetime.combine(start_date, time(1, 0), tzinfo=timezone.utc)
        except ValueError:
            next_run = datetime.now(timezone.utc)
    else:
        next_run = datetime.now(timezone.utc)

    config = {
        "transaction_amount": str(emi_amount),
        "frequency": "MONTHLY",
        "source_account_id": linked_account_id,
        "target_account_id": loan_account.account_id
    }

    debit_rule = Rule(
        account_id=loan_account.account_id,
        name=rule_name,
        rule_type=RuleType.TRANSACTION,
        configuration=config,
        next_run_at=next_run,
        is_active=True
    )
    session.add(debit_rule)
    return debit_rule
