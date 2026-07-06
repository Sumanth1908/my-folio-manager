import calendar
import logging
from typing import Optional
from datetime import datetime, timezone, time
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from sqlmodel import Session, select, func

from app.models.account import Account, AccountType
from app.models.rule import Rule, RuleType
from app.models.rule_execution import RuleExecution, RuleExecutionStatus
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransferRequest
from app.schemas.rule import (RuleCreate, RulePreview, RuleRead, RuleUpdate,
                              validate_rule_configuration)
from app.services.transaction_service import (create_transaction_core,
                                              create_transfer_core)
from app.services.rule_strategy import RuleProcessorFactory, SCHEDULABLE_RULE_TYPES

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


def replace_day_clamped(dt: datetime, day: int) -> datetime:
    """Set the day-of-month, clamping to the month's last day (Jan 31 + 1 month → Feb 28/29)."""
    last_day = calendar.monthrange(dt.year, dt.month)[1]
    return dt.replace(day=min(int(day), last_day))


def prepare_rule_posting(session: Session, rule: Rule, account: Account) -> dict:
    """Compute what a rule would post right now, without posting anything.

    Shared by real execution and the dry-run preview endpoint.
    """
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
    is_debit = config.get("is_debit", False) or config.get("transaction_type") == "DEBIT"

    return {
        "amount": transaction_amount,
        "is_debit": is_debit,
        "description": description,
        "additional_info": additional_info,
        "transaction_date": transaction_date,
        "period_start": period_start,
        "period_end": period_end,
        "days": days_to_post,
        "frequency": frequency,
        "category_id": config.get("category_id"),
        "target_account_id": target_account_id,
        "source_account_id": source_account_id,
    }


def compute_next_run(rule: Rule, account: Account, frequency: Optional[str], now_utc: datetime) -> tuple[Optional[datetime], bool]:
    """Return (next_run_at, is_active) after a successful run."""
    if frequency == "ONE_TIME" or not frequency:
        return None, False

    current_run = make_aware(rule.next_run_at) or now_utc

    if frequency == "DAILY":
        next_run = current_run + relativedelta(days=1) if now_utc <= current_run else now_utc + relativedelta(days=1)
    elif frequency == "WEEKLY":
        next_run = current_run + relativedelta(weeks=1)
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

            next_run = replace_day_clamped(next_date, accrual_day)
        else:
            next_run = next_date
    elif frequency == "YEARLY":
        next_run = current_run + relativedelta(years=1)
    else:
        # Unknown frequency: configuration validation should make this
        # unreachable; deactivate rather than refire every scheduler tick.
        logger.error(f"Rule {rule.rule_id} has unknown frequency '{frequency}'; deactivating")
        return None, False

    config = rule.configuration or {}
    end_date = config.get("end_date")
    if end_date and next_run:
        end_dt = make_aware(datetime.fromisoformat(end_date))
        if make_aware(next_run) >= end_dt:
            return None, False

    return next_run, True


def process_single_rule(session: Session, rule: Rule):
    """Execute a due rule atomically.

    The posted transaction(s), the advanced next_run_at, and the execution
    record are committed together — a crash at any point leaves either a fully
    processed rule or an untouched one, never a double-post.
    """
    account = session.get(Account, rule.account_id)
    if not account:
        logger.error(f"Account {rule.account_id} not found for rule {rule.rule_id}")
        return
    user_id = account.user_id

    if account.status == "Closed":
        logger.info(f"Rule {rule.rule_id} targets closed account {account.account_id}; deactivating")
        rule.is_active = False
        rule.next_run_at = None
        session.add(rule)
        session.add(RuleExecution(
            rule_id=rule.rule_id,
            status=RuleExecutionStatus.SKIPPED,
            error="Account is closed; rule deactivated",
        ))
        session.commit()
        return

    now_utc = datetime.now(timezone.utc)
    posting = prepare_rule_posting(session, rule, account)

    execution = RuleExecution(
        rule_id=rule.rule_id,
        status=RuleExecutionStatus.SUCCESS,
        period_start=posting["period_start"].replace(tzinfo=None),
        period_end=posting["period_end"].replace(tzinfo=None),
    )

    if posting["amount"] == 0:
        # Nothing to post (e.g. zero balance) — advance the schedule anyway so
        # the rule doesn't refire every tick.
        execution.status = RuleExecutionStatus.SKIPPED
        execution.amount = Decimal("0.00")
        execution.error = "Computed amount was zero; nothing posted"
        next_run, is_active = compute_next_run(rule, account, posting["frequency"], now_utc)
        rule.next_run_at = next_run.replace(tzinfo=None) if next_run and next_run.tzinfo else next_run
        rule.is_active = is_active
        session.add(rule)
        session.add(execution)
        session.commit()
        session.refresh(rule)
        return

    if posting["target_account_id"] or posting["source_account_id"]:
        from_acc = posting["source_account_id"] or rule.account_id
        to_acc = posting["target_account_id"] or rule.account_id

        transfer_request = TransferRequest(
            from_account_id=from_acc,
            to_account_id=to_acc,
            amount=posting["amount"],
            description=posting["description"],
            additional_info=posting["additional_info"],
            category_id=posting["category_id"],
            transaction_date=posting["transaction_date"]
        )
        result = create_transfer_core(session, transfer_request, user_id, commit=False)
        execution.transfer_id = result.get("transfer_id")
        execution.amount = posting["amount"]
    else:
        transaction_amount = abs(posting["amount"])
        if posting["is_debit"]:
            transaction_amount = -transaction_amount

        tx_create = TransactionCreate(
            account_id=rule.account_id,
            amount=transaction_amount,
            description=posting["description"],
            additional_info=posting["additional_info"],
            category_id=posting["category_id"],
            transaction_date=posting["transaction_date"]
        )
        transaction = create_transaction_core(session, tx_create, user_id, commit=False)
        execution.transaction_id = transaction.transaction_id
        execution.amount = transaction_amount

    next_run, is_active = compute_next_run(rule, account, posting["frequency"], now_utc)
    rule.next_run_at = next_run.replace(tzinfo=None) if next_run and next_run.tzinfo else next_run
    rule.is_active = is_active

    session.add(rule)
    session.add(execution)
    session.commit()
    session.refresh(rule)


def record_rule_failure(engine, rule_id: int, error: str):
    """Persist a FAILED execution in its own session (the run's session rolled back)."""
    try:
        with Session(engine) as session:
            session.add(RuleExecution(
                rule_id=rule_id,
                status=RuleExecutionStatus.FAILED,
                error=error[:500],
            ))
            session.commit()
    except Exception as e:
        logger.error(f"Could not record failure for rule {rule_id}: {e}")


def get_rule_executions(session: Session, rule_id: int, user_id: str, limit: int = 50):
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        return None
    return session.exec(
        select(RuleExecution)
        .where(RuleExecution.rule_id == rule_id)
        .order_by(RuleExecution.ran_at.desc())
        .limit(limit)
    ).all()


def preview_rule(session: Session, rule_id: int, user_id: str) -> RulePreview:
    """Dry-run: compute what the rule would post, without posting."""
    rule = get_rule_with_ownership(session, rule_id, user_id)
    if not rule:
        raise ValueError("Rule not found")
    if rule.rule_type not in SCHEDULABLE_RULE_TYPES:
        raise ValueError("Only transaction or calculation rules can be previewed.")

    account = session.get(Account, rule.account_id)
    if not account:
        raise ValueError("Account not found")

    posting = prepare_rule_posting(session, rule, account)
    return RulePreview(
        rule_id=rule.rule_id,
        amount=abs(posting["amount"]),
        is_debit=posting["is_debit"],
        description=posting["description"],
        period_start=posting["period_start"],
        period_end=posting["period_end"],
        days=posting["days"],
        from_account_id=posting["source_account_id"] or (rule.account_id if posting["target_account_id"] else None),
        to_account_id=posting["target_account_id"],
    )

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

    # Reject broken configurations (bad formula, missing keys, unknown
    # frequency) at creation time instead of at execution time inside Celery.
    validate_rule_configuration(rule_in.rule_type, rule_in.configuration)

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

    effective_type = rule_data.get("rule_type", rule.rule_type)
    if "configuration" in rule_data or "rule_type" in rule_data:
        effective_config = rule_data.get("configuration", rule.configuration)
        validate_rule_configuration(effective_type, effective_config)

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

    if rule.rule_type not in SCHEDULABLE_RULE_TYPES:
        raise ValueError("Only transaction or calculation rules can be manually executed.")

    account = session.get(Account, rule.account_id)
    if account and account.status == "Closed":
        raise ValueError("Account is closed; this rule cannot be executed.")

    process_single_rule(session, rule)
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
