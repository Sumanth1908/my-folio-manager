"""Jobs router for manual job triggers."""
import logging

from fastapi import APIRouter, Depends

from app.tasks.automation import process_automation_rules, run_automation_batch
from app.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/trigger-interest-accrual")
def trigger_interest_accrual(current_user = Depends(get_current_user)):
    """Manually trigger the automation rules batch.

    Enqueues the batch on the Celery worker; if the broker is unreachable
    (e.g. local dev without Redis), falls back to running it inline. Both
    paths are serialized by the batch's Redis lock.
    """
    try:
        process_automation_rules.delay()
        return {"message": "Automation rules check enqueued."}
    except Exception as e:
        logger.warning(f"Could not enqueue automation batch ({e}); running inline")
        result = run_automation_batch()
        return {"message": "Automation rules check completed inline.", **result}
