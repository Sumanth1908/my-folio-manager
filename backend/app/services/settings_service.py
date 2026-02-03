from typing import Optional
from sqlmodel import Session, select

from app.models.settings import Settings


def get_user_settings(session: Session, user_id: str) -> Settings:
    """Get settings for a user, creating defaults if they don't exist."""
    settings = session.exec(select(Settings).where(Settings.user_id == user_id)).first()
    
    if not settings:
        settings = Settings(user_id=user_id)
        session.add(settings)
        session.commit()
        session.refresh(settings)
        
    return settings


def update_user_settings(session: Session, user_id: str, settings_update: Settings) -> Settings:
    """Update settings for a user."""
    db_settings = session.exec(select(Settings).where(Settings.user_id == user_id)).first()
    
    if not db_settings:
        db_settings = Settings(user_id=user_id)
        session.add(db_settings)
    
    db_settings.default_currency = settings_update.default_currency
    db_settings.exchange_provider = settings_update.exchange_provider
    
    session.add(db_settings)
    session.commit()
    session.refresh(db_settings)
    return db_settings
