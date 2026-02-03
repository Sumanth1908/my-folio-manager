from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.models.settings import Settings
from app.models.user import User
from app.services import settings_service
from app.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/", response_model=Settings)
def get_settings(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get settings for the current user."""
    return settings_service.get_user_settings(session, current_user.user_id)


@router.put("/", response_model=Settings)
@router.patch("/", response_model=Settings)
def update_settings(
    settings_update: Settings,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Update user settings."""
    return settings_service.update_user_settings(session, current_user.user_id, settings_update)
