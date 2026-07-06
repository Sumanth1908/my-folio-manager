from sqlmodel import Field, SQLModel


class Settings(SQLModel, table=True):
    """User settings model."""
    __tablename__ = "settings"
    user_id: str = Field(primary_key=True, max_length=36)
    default_currency: str = Field(default="USD", max_length=3)
    exchange_provider: str = Field(default="Manual", max_length=50) 
