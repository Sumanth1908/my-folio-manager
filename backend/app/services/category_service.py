from typing import List, Optional
from sqlmodel import Session, select

from app.models.category import Category
from app.schemas.category import CategoryCreate


def get_categories(session: Session, user_id: str) -> List[Category]:
    """Get all categories for a user."""
    return session.exec(select(Category).where(Category.user_id == user_id)).all()


def get_category_with_ownership(session: Session, category_id: int, user_id: str) -> Optional[Category]:
    """Fetch a category and verify it belongs to the user."""
    category = session.get(Category, category_id)
    if category and category.user_id == user_id:
        return category
    return None


def create_category(session: Session, category_in: CategoryCreate, user_id: str) -> Optional[Category]:
    """Create a new category for a user."""
    # Check for duplicate name
    existing = session.exec(
        select(Category).where(Category.name == category_in.name, Category.user_id == user_id)
    ).first()
    if existing:
        return None
        
    category = Category(**category_in.model_dump(), user_id=user_id)
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


def update_category(session: Session, category_id: int, category_update: CategoryCreate, user_id: str) -> Optional[Category]:
    """Update a category if it belongs to the user."""
    category = get_category_with_ownership(session, category_id, user_id)
    if not category:
        return None
        
    category.name = category_update.name
    category.color = category_update.color
    category.icon = category_update.icon
    
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


def delete_category(session: Session, category_id: int, user_id: str) -> bool:
    """Delete a category if it belongs to the user."""
    category = get_category_with_ownership(session, category_id, user_id)
    if not category:
        return False
        
    session.delete(category)
    session.commit()
    return True
