"""Jobs router for manual job triggers."""
from fastapi import APIRouter

from app.tasks.interest_tasks import process_daily_interest_accruals

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/trigger-interest-accrual")
def trigger_interest_accrual():
    """
    Manually trigger the daily interest accrual job.
    
    This endpoint is useful for testing without waiting for the scheduled time.
    It will process interest for all accounts whose interest_accrual_day matches today.
    Returns a summary of accounts processed and total interest applied.
    """
    result = process_daily_interest_accruals()
    return result
