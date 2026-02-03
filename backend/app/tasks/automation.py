import logging
from datetime import datetime, timezone

from sqlmodel import Session, select

from celery import shared_task
from app.core.database import engine
from app.models.rule import Rule, RuleType
from app.services.rules_service import process_single_rule

logger = logging.getLogger(__name__)

@shared_task(name="app.tasks.automation.process_automation_rules")
def process_automation_rules():
    """
    Periodic task to execute due automation rules (Transaction Rules).
    """
    logger.info("Starting automation rules processing...")
    
    with Session(engine) as session:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Find active transaction rules that are due
        query = select(Rule).where(
            Rule.rule_type.in_([RuleType.TRANSACTION, RuleType.CALCULATION]),
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
