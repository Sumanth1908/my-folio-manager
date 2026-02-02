from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.settings import Settings
from app.models.user import User  # Assuming we can get current user
from app.routers.auth import get_current_user  # Assuming auth is set up

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/", response_model=Settings)
def get_settings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get settings for the current user. Create if not exists."""
    # Since we don't have a real strict User link yet in some parts, we use what we have.
    # Assuming user_id is integer from the auth dependency.
    
    settings = session.exec(select(Settings).where(Settings.user_id == current_user.user_id)).first()
    
    if not settings:
        # Create default settings
        settings = Settings(user_id=current_user.user_id)
        session.add(settings)
        session.commit()
        session.refresh(settings)
        
    return settings


@router.put("/", response_model=Settings)
@router.patch("/", response_model=Settings)
def update_settings(
    settings_update: Settings,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Update user settings."""
    db_settings = session.exec(select(Settings).where(Settings.user_id == current_user.user_id)).first()
    
    if not db_settings:
        db_settings = Settings(user_id=current_user.user_id)
        session.add(db_settings)
    
    # Update fields
    db_settings.default_currency = settings_update.default_currency
    db_settings.exchange_provider = settings_update.exchange_provider
    
    session.add(db_settings)
    session.commit()
    session.refresh(db_settings)
    return db_settings
