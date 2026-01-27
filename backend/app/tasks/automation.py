import logging
from datetime import datetime

from dateutil.relativedelta import relativedelta
from sqlmodel import Session, select

from celery import shared_task
from app.core.database import engine
from app.models.account import Account, AccountType
from app.models.loan_account import LoanAccount
from app.models.rule import Frequency, Rule, RuleType
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransferRequest
from app.services.transaction_service import (create_transaction_core,
                                              create_transfer_core)

logger = logging.getLogger(__name__)

@shared_task(name="app.tasks.automation.process_automation_rules")
def process_automation_rules():
    """
    Periodic task to execute due automation rules (Transaction Rules).
    """
    logger.info("Starting automation rules processing...")
    
    with Session(engine) as session:
        now = datetime.utcnow()
        
        # Find active transaction rules that are due
        query = select(Rule).where(
            Rule.rule_type == RuleType.TRANSACTION,
            Rule.is_active == True,
            Rule.next_run_at <= now
        )
        due_rules = session.exec(query).all()
        
        logger.info(f"Found {len(due_rules)} due rules to process.")
        
        for rule in due_rules:
            try:
                logger.info(f"Processing Rule ID {rule.rule_id}: {rule.name}")
                process_single_rule(session, rule)
            except Exception as e:
                logger.error(f"Error processing rule {rule.rule_id}: {str(e)}")
                # Continue with other rules even if one fails
        
        session.commit()
    
    logger.info("Automation rules processing completed.")


def process_single_rule(session: Session, rule: Rule):
    # 1. Execute the Rule Logic (Creation/Transfer)
    description = f"Auto: {rule.name}"
    
    # Check if it's a transfer
    if rule.target_account_id:
        transfer_request = TransferRequest(
            from_account_id=rule.account_id,
            to_account_id=rule.target_account_id,
            amount=rule.transaction_amount,
            description=description,
            category_id=rule.category_id
        )
        try:
            logger.info(f"Executing transfer for rule {rule.rule_id}")
            create_transfer_core(session, transfer_request)
        except Exception as e:
            logger.error(f"Failed to create transfer for rule {rule.rule_id}: {e}")
            raise e
    else:
        # Standard Transaction
        tx_create = TransactionCreate(
            account_id=rule.account_id,
            amount=rule.transaction_amount,
            transaction_type=rule.transaction_type,
            description=description,
            category_id=rule.category_id,
            transaction_date=datetime.now()
        )
        try:
            logger.info(f"Executing transaction for rule {rule.rule_id}")
            create_transaction_core(session, tx_create)
        except Exception as e:
            logger.error(f"Failed to create transaction for rule {rule.rule_id}: {e}")
            raise e

    # 2. Schedule Next Run (unchanged)


    # 3. Schedule Next Run
    if rule.frequency == Frequency.ONE_TIME:
        rule.is_active = False
        rule.next_run_at = None
    else:
        # Calculate next date
        current_run = rule.next_run_at or datetime.now()
        
        if rule.frequency == Frequency.DAILY:
            rule.next_run_at = current_run + relativedelta(days=1)
        elif rule.frequency == Frequency.WEEKLY:
            rule.next_run_at = current_run + relativedelta(weeks=1)
        elif rule.frequency == Frequency.MONTHLY:
            rule.next_run_at = current_run + relativedelta(months=1)
        elif rule.frequency == Frequency.YEARLY:
           rule.next_run_at = current_run + relativedelta(years=1)
            
    session.add(rule)
