from datetime import datetime
from typing import Optional
import uuid

from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    """User model for authentication."""
    __tablename__ = "users"

    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, max_length=36)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    full_name: Optional[str] = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
