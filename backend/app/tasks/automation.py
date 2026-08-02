import logging
from datetime import datetime, timezone

import redis
from sqlmodel import Session, select

from celery import shared_task
from app.core.config import settings
from app.core.database import engine
from app.models.rule import Rule
from app.services.rule_strategy import SCHEDULABLE_RULE_TYPES
from app.services.rules_service import process_single_rule, record_rule_failure

logger = logging.getLogger(__name__)

LOCK_NAME = "automation-rules-batch-lock"
LOCK_TIMEOUT = 10 * 60  # seconds; auto-released if a run dies mid-batch


def run_automation_batch() -> dict:
    """Execute all due rules, one DB session per rule.

    Serialized via a Redis lock so an overlapping beat tick or a manual
    trigger can never process the same due rule twice. Each rule commits (or
    rolls back) independently — one bad rule can't poison the rest.
    """
    lock = None
    try:
        client = redis.Redis.from_url(settings.redis_url, socket_connect_timeout=2, socket_timeout=2)
        lock = client.lock(LOCK_NAME, timeout=LOCK_TIMEOUT, blocking=False)
        if not lock.acquire(blocking=False):
            logger.info("Automation batch already running; skipping this tick.")
            return {"processed": 0, "failed": 0, "skipped_lock": True}
    except redis.RedisError as e:
        logger.warning(f"Redis lock unavailable ({e}); running without overlap protection")
        lock = None

    processed = 0
    failed = 0
    try:
        with Session(engine) as session:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            due_rule_ids = session.exec(
                select(Rule.rule_id)
                .where(
                    Rule.rule_type.in_(SCHEDULABLE_RULE_TYPES),
                    Rule.is_active == True,
                    Rule.next_run_at <= now
                )
                .order_by(
                    Rule.next_run_at.asc(),
                    Rule.execution_order.asc(),
                    Rule.rule_id.asc(),
                )
            ).all()

        logger.info(f"Found {len(due_rule_ids)} due rules to process.")

        for rule_id in due_rule_ids:
            with Session(engine) as rule_session:
                rule = rule_session.get(Rule, rule_id)
                if not rule or not rule.is_active:
                    continue
                try:
                    logger.info(f"Processing Rule ID {rule.rule_id}: {rule.name}")
                    process_single_rule(rule_session, rule)
                    processed += 1
                except Exception as e:
                    failed += 1
                    logger.error(f"Error processing rule {rule_id}: {str(e)}")
                    rule_session.rollback()
                    record_rule_failure(engine, rule_id, str(e))
    finally:
        if lock is not None:
            try:
                lock.release()
            except Exception:
                pass

    logger.info(f"Automation rules processing completed: {processed} processed, {failed} failed.")
    return {"processed": processed, "failed": failed, "skipped_lock": False}


@shared_task(name="app.tasks.automation.process_automation_rules")
def process_automation_rules():
    """Periodic task to execute due automation rules."""
    return run_automation_batch()
