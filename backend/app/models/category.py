from typing import Optional
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
