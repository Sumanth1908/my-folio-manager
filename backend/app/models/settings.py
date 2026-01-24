from typing import Optional

from sqlmodel import Field, SQLModel


class Settings(SQLModel, table=True):
    """User settings model."""
    setting_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(unique=True, index=True, max_length=36)
    default_currency: str = Field(default="USD", max_length=3)
    exchange_provider: str = Field(default="Manual", max_length=50) 
