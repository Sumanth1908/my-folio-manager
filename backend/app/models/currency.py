from typing import Optional

from sqlmodel import Field, SQLModel


class Currency(SQLModel, table=True):
    """Currency model for multi-currency support."""
    code: str = Field(primary_key=True, max_length=3)
    name: str = Field(max_length=50)
    symbol: str = Field(max_length=5)
