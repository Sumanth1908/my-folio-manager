from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.models.user import User
from app.schemas.rule import RuleCreate, RuleRead, RuleUpdate
from app.services import rules_service
from app.deps import get_current_user

router = APIRouter(prefix="/rules", tags=["rules"])


@router.post("/", response_model=RuleRead)
def create_rule(
    rule_in: RuleCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new automation rule."""
    rule = rules_service.create_rule(session, rule_in, current_user.user_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Account not found or access denied")
        
    return rules_service.enrich_rule(session, rule)


@router.get("/", response_model=List[RuleRead])
def read_rules(
    account_id: Optional[str] = None, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all rules, optionally filtered by account."""
    rules = rules_service.get_rules(session, current_user.user_id, account_id)
    return [rules_service.enrich_rule(session, r) for r in rules]


@router.put("/{rule_id}", response_model=RuleRead)
@router.patch("/{rule_id}", response_model=RuleRead)
def update_rule(
    rule_id: int, 
    rule_update: RuleUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a rule."""
    rule = rules_service.update_rule(session, rule_id, rule_update, current_user.user_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    return rules_service.enrich_rule(session, rule)


@router.post("/{rule_id}/execute", response_model=RuleRead)
def execute_rule_now(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger a rule execution immediately."""
    try:
        rule = rules_service.execute_rule_now_core(session, rule_id, current_user.user_id)
        return rules_service.enrich_rule(session, rule)
    except ValueError as e:
        status_code = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute rule: {str(e)}")


@router.delete("/{rule_id}")
def delete_rule(
    rule_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a rule."""
    success = rules_service.delete_rule(session, rule_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    return {"ok": True}
