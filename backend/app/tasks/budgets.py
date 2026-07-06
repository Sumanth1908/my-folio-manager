import logging

from sqlmodel import Session

from celery import shared_task
from app.core.database import engine
from app.services import budget_service

logger = logging.getLogger(__name__)


@shared_task(name="app.tasks.budgets.copy_forward_budgets_task")
def copy_forward_budgets_task():
    """Periodic task: carry last month's budgets forward into the new month."""
    with Session(engine) as session:
        result = budget_service.copy_forward_budgets(session)
        logger.info(f"Budget copy-forward completed: {result['created']} created.")
        return result
