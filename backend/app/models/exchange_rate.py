from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Column, ForeignKey, String, UniqueConstraint
from sqlmodel import Field, SQLModel


class ExchangeRate(SQLModel, table=True):
    """Stores fetched currency exchange rates for multi-currency portfolio valuation.

    Rates are directional: from_currency → to_currency at `rate` on `fetched_at`.
    Use the most recent record per (from_currency, to_currency) pair for current rate.
    """
    __tablename__ = "exchange_rates"
    __table_args__ = (
        UniqueConstraint("from_currency", "to_currency", "fetched_at", name="unique_rate_per_pair_timestamp"),
    )

    id: int | None = Field(default=None, primary_key=True)
    from_currency: str = Field(
        sa_column=Column(String(3), ForeignKey("currency.code", ondelete="CASCADE"), nullable=False, index=True)
    )
    to_currency: str = Field(
        sa_column=Column(String(3), ForeignKey("currency.code", ondelete="CASCADE"), nullable=False, index=True)
    )
    rate: Decimal = Field(max_digits=20, decimal_places=8)
    fetched_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        index=True,
    )
    provider: str | None = Field(default=None, max_length=50)  # e.g. "manual", "open_exchange_rates"
