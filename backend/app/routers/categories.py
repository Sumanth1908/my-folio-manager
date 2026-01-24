"""Categories router for managing transaction categories."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRead
from app.deps import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/")
def list_categories(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all categories for current user."""
    categories = session.exec(select(Category).where(Category.user_id == current_user.user_id)).all()
    return categories


@router.post("/", response_model=CategoryRead)
def create_category(
    category_in: CategoryCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new category."""
    # Check if category with same name exists for this user
    existing = session.exec(
        select(Category).where(Category.name == category_in.name, Category.user_id == current_user.user_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    category = Category(**category_in.model_dump(), user_id=current_user.user_id)
    
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.get("/{category_id}")
def get_category(
    category_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific category by ID."""
    category = session.get(Category, category_id)
    if not category or category.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int, 
    updated_category: CategoryCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a category."""
    category = session.get(Category, category_id)
    if not category or category.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Update fields
    category.name = updated_category.name
    category.color = updated_category.color
    category.icon = updated_category.icon
    
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a category."""
    category = session.get(Category, category_id)
    if not category or category.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Category not found")
    
    session.delete(category)
    session.commit()
    return {"message": "Category deleted successfully"}
