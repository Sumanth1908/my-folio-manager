from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from app.models.transaction import TransactionType
from app.schemas.category import CategoryRead


class TransactionBase(BaseModel):
    amount: Decimal
    transaction_type: TransactionType
    description: Optional[str] = None
    category_id: Optional[int] = None
    transaction_date: datetime = Field(default_factory=datetime.utcnow)


class TransactionCreate(TransactionBase):
    account_id: str
    currency: Optional[str] = None  # Optional, defaults to account's currency

    # Override date to be optional for creation if needed
    transaction_date: Optional[datetime] = None


class TransactionRead(TransactionBase):
    transaction_id: int
    account_id: str
    currency: str
    transaction_date: datetime
    category: Optional[CategoryRead] = None

    class Config:
        from_attributes = True


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = None
    transaction_type: Optional[TransactionType] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    transaction_date: Optional[datetime] = None


class TransferRequest(BaseModel):
    from_account_id: str
    to_account_id: str
    amount: Decimal
    description: Optional[str] = None
    category_id: Optional[int] = None
