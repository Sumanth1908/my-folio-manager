from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRead
from app.services import category_service
from app.deps import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=List[CategoryRead])
def list_categories(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all categories for current user."""
    return category_service.get_categories(session, current_user.user_id)


@router.post("/", response_model=CategoryRead)
def create_category(
    category_in: CategoryCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new category."""
    category = category_service.create_category(session, category_in, current_user.user_id)
    if not category:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    return category


@router.get("/{category_id}", response_model=CategoryRead)
def get_category(
    category_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific category by ID."""
    category = category_service.get_category_with_ownership(session, category_id, current_user.user_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/{category_id}", response_model=CategoryRead)
@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int, 
    updated_category: CategoryCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a category."""
    category = category_service.update_category(session, category_id, updated_category, current_user.user_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a category."""
    success = category_service.delete_category(session, category_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}
