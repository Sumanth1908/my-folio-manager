"""Jobs router for manual job triggers."""
from fastapi import APIRouter

from app.tasks.automation import process_automation_rules

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/trigger-interest-accrual")
def trigger_interest_accrual():
    """
    Manually trigger the daily interest accrual job.
    
    This endpoint is useful for testing without waiting for the scheduled time.
    It will process interest for all accounts whose interest_accrual_day matches today.
    Returns a summary of accounts processed and total interest applied.
    """
    process_automation_rules()
    return {"message": "Automation rules check triggered."}
