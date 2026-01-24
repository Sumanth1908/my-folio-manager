from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.category import Category
from app.models.account import Account
from app.models.rule import Rule, RuleType
from app.models.user import User
from app.schemas.rule import RuleCreate, RuleRead, RuleUpdate
from app.tasks.automation import process_single_rule
from app.deps import get_current_user

router = APIRouter(prefix="/rules", tags=["rules"])


@router.post("/", response_model=RuleRead)
def create_rule(
    rule_in: RuleCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new automation rule."""
    # Verify account ownership
    account = session.get(Account, rule_in.account_id)
    if not account or account.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Account not found")

    rule = Rule.model_validate(rule_in)
    # rule.user_id = current_user.user_id # Removed as per normalization
    
    session.add(rule)
    session.commit()
    session.refresh(rule)
    
    # Return enriched read model
    return _enrich_rule(session, rule)


@router.get("/", response_model=List[RuleRead])
def read_rules(
    account_id: Optional[str] = None, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all rules, optionally filtered by account."""
    # Join with Account to filter by user_id
    query = select(Rule).join(Account, Rule.account_id == Account.account_id).where(Account.user_id == current_user.user_id)
    
    if account_id:
        query = query.where(Rule.account_id == account_id)
    
    rules = session.exec(query).all()
    return [_enrich_rule(session, r) for r in rules]


@router.put("/{rule_id}", response_model=RuleRead)
def update_rule(
    rule_id: int, 
    rule_update: RuleUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a rule."""
    # Join with Account to verify ownership
    result = session.exec(
        select(Rule, Account)
        .join(Account, Rule.account_id == Account.account_id)
        .where(Rule.rule_id == rule_id)
        .where(Account.user_id == current_user.user_id)
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db_rule, _ = result
    
    rule_data = rule_update.model_dump(exclude_unset=True)
    for key, value in rule_data.items():
        setattr(db_rule, key, value)
        
    session.add(db_rule)
    session.commit()
    session.refresh(db_rule)
    
    return _enrich_rule(session, db_rule)


@router.post("/{rule_id}/execute", response_model=RuleRead)
def execute_rule_now(
    rule_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger a rule execution immediately."""
    # Join with Account to verify ownership
    result = session.exec(
        select(Rule, Account)
        .join(Account, Rule.account_id == Account.account_id)
        .where(Rule.rule_id == rule_id)
        .where(Account.user_id == current_user.user_id)
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule, _ = result
    
    if rule.rule_type != RuleType.TRANSACTION:
        raise HTTPException(status_code=400, detail="Only transaction rules can be manually executed.")

    # Execute the rule
    # Note: process_single_rule handles the transaction creation and next_run_at update
    # calling it here effectively 'runs' it.
    try:
        process_single_rule(session, rule)
        session.commit() # Ensure changes from process_single_rule are committed if it doesn't commit itself (it does, but safety check)
        session.refresh(rule)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute rule: {str(e)}")

    return _enrich_rule(session, rule)



@router.delete("/{rule_id}")
def delete_rule(
    rule_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a rule."""
    # Join with Account to verify ownership
    result = session.exec(
        select(Rule)
        .join(Account, Rule.account_id == Account.account_id)
        .where(Rule.rule_id == rule_id)
        .where(Account.user_id == current_user.user_id)
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Rule not found")
        
    session.delete(result)
    session.commit()
    return {"ok": True}


def _enrich_rule(session: Session, rule: Rule) -> RuleRead:
    """Helper to attach category details to rule response."""
    rule_dict = rule.model_dump()
    if rule.category_id:
        category = session.get(Category, rule.category_id)
        if category:
            rule_dict['category_name'] = category.name            
    return RuleRead.model_validate(rule_dict)
