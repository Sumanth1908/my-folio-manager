from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Column, ForeignKey, Index, Integer, String
from sqlmodel import Field, SQLModel


class Transaction(SQLModel, table=True):
    """Transaction model representing a financial transaction."""
    __tablename__ = "transactions"
    __table_args__ = (
        # Balance derivation and history queries always filter by account and
        # sort/range on date — cover both with one composite index.
        Index("ix_transactions_account_date", "account_id", "transaction_date"),
    )

    transaction_id: Optional[int] = Field(default=None, primary_key=True)
    account_id: str = Field(sa_column=Column(String(36), ForeignKey("accounts.account_id", ondelete="CASCADE"), nullable=False))
    amount: Decimal = Field(max_digits=15, decimal_places=2, description="Signed amount. Positive for deposits/credits, negative for withdrawals/debits")
    currency: str = Field(default="USD", max_length=10)
    description: Optional[str] = Field(default=None, max_length=255)
    additional_info: Optional[str] = Field(default=None, max_length=500)
    category_id: Optional[int] = Field(default=None, sa_column=Column(Integer, ForeignKey("category.category_id", ondelete="SET NULL"), nullable=True))
    transfer_id: Optional[str] = Field(default=None, max_length=36, index=True)
    # Client-supplied key to make POSTs safely retryable (unique; NULLs exempt)
    idempotency_key: Optional[str] = Field(default=None, max_length=64, unique=True)
    transaction_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
