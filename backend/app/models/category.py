from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import Column, ForeignKey, String, UniqueConstraint
from sqlmodel import Field, SQLModel


class Category(SQLModel, table=True):
    """Category model for transaction categorization."""
    __tablename__ = "category"
    __table_args__ = (
        UniqueConstraint('name', 'user_id', name='unique_category_per_user'),
    )
    
    category_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(sa_column=Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True))
    name: str = Field(max_length=50, index=True)
    
    color: Optional[str] = Field(default=None, max_length=7)
    icon: Optional[str] = Field(default=None, max_length=50)
    parent_id: Optional[int] = Field(default=None, foreign_key="category.category_id", nullable=True)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)})
