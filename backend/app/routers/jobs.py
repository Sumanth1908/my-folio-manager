"""Jobs router for manual job triggers."""
from fastapi import APIRouter, Depends

from app.tasks.automation import process_automation_rules
from app.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/trigger-interest-accrual")
def trigger_interest_accrual(current_user = Depends(get_current_user)):
    """
    Manually trigger the daily interest accrual job.
    
    This endpoint is useful for testing without waiting for the scheduled time.
    It will process interest for all accounts whose interest_accrual_day matches today.
    Returns a summary of accounts processed and total interest applied.
    """
    process_automation_rules()
    return {"message": "Automation rules check triggered."}
