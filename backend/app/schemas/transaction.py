from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.category import CategoryRead


class TransactionBase(BaseModel):
    account_id: str = Field(..., max_length=36)
    amount: Decimal = Field(..., max_digits=15, decimal_places=2, description="Signed amount. Positive for deposits, negative for withdrawals.")
    currency: str = Field(default="USD", max_length=10, description="Ignored on create; the account's currency is always used.")
    description: Optional[str] = Field(default=None, max_length=255)
    additional_info: Optional[str] = Field(default=None, max_length=500)
    category_id: Optional[int] = Field(default=None)
    transaction_date: Optional[datetime] = None


class TransactionCreate(TransactionBase):
    idempotency_key: Optional[str] = Field(default=None, max_length=64)

    @field_validator("amount")
    @classmethod
    def amount_nonzero(cls, v: Decimal) -> Decimal:
        if v == 0:
            raise ValueError("Amount must not be zero")
        return v


class TransactionUpdate(BaseModel):
    amount: Optional[Decimal] = Field(default=None, max_digits=15, decimal_places=2)
    description: Optional[str] = Field(default=None, max_length=255)
    additional_info: Optional[str] = Field(default=None, max_length=500)
    category_id: Optional[int] = None
    transaction_date: Optional[datetime] = None

    @field_validator("amount")
    @classmethod
    def amount_nonzero(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v == 0:
            raise ValueError("Amount must not be zero")
        return v


class TransactionRead(TransactionBase):
    transaction_id: int
    account_id: str
    currency: str
    transaction_date: datetime
    category: Optional[CategoryRead] = None
    transfer_id: Optional[str] = None
    transaction_kind: str = "USER"

    class Config:
        from_attributes = True




class TransferRequest(BaseModel):
    from_account_id: str
    to_account_id: str
    amount: Decimal = Field(gt=0)
    to_amount: Optional[Decimal] = Field(default=None, gt=0)
    description: Optional[str] = None
    additional_info: Optional[str] = None
    category_id: Optional[int] = None
    transaction_date: Optional[datetime] = None
    idempotency_key: Optional[str] = Field(default=None, max_length=64)
