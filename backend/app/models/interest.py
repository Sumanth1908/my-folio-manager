from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlmodel import Field, SQLModel


class InterestDirection(str, Enum):
    EARNED = "EARNED"
    CHARGED = "CHARGED"


class InterestBalanceBasis(str, Enum):
    LEDGER_BALANCE = "LEDGER_BALANCE"
    FIXED_PRINCIPAL = "FIXED_PRINCIPAL"
    PRINCIPAL_OUTSTANDING = "PRINCIPAL_OUTSTANDING"


class InterestDayCount(str, Enum):
    ACTUAL_365 = "ACTUAL_365"
    ACTUAL_ACTUAL = "ACTUAL_ACTUAL"
    THIRTY_360 = "THIRTY_360"


class InterestTreatment(str, Enum):
    CAPITALIZE = "CAPITALIZE"
    PAYOUT = "PAYOUT"
    INTEREST_DUE = "INTEREST_DUE"


class InterestPolicy(SQLModel, table=True):
    """Versioned calculation terms for one interest-bearing account.

    Scheduling deliberately stays on Rule. This model describes the financial
    contract; an INTEREST rule decides when the engine settles it.
    """

    __tablename__ = "interest_policies"

    policy_id: Optional[int] = Field(default=None, primary_key=True)
    account_id: str = Field(
        sa_column=Column(
            String(36),
            ForeignKey("accounts.account_id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
            index=True,
        )
    )
    enabled: bool = Field(default=True)
    direction: str = Field(default=InterestDirection.EARNED.value, max_length=20)
    annual_rate: Decimal = Field(max_digits=9, decimal_places=6)
    balance_basis: str = Field(default=InterestBalanceBasis.LEDGER_BALANCE.value, max_length=30)
    day_count: str = Field(default=InterestDayCount.ACTUAL_365.value, max_length=20)
    treatment: str = Field(default=InterestTreatment.CAPITALIZE.value, max_length=20)
    settlement_frequency: str = Field(default="MONTHLY", max_length=20)
    payout_account_id: Optional[str] = Field(
        default=None,
        sa_column=Column(
            String(36),
            ForeignKey("accounts.account_id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    category_id: Optional[int] = Field(
        default=None,
        sa_column=Column(
            Integer,
            ForeignKey("category.category_id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    effective_from: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    end_date: Optional[datetime] = None
    calculation_version: int = Field(default=1)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc).replace(tzinfo=None)},
    )


class InterestExecutionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"


class InterestRatePeriod(SQLModel, table=True):
    """Effective-dated annual rate for an interest policy."""

    __tablename__ = "interest_rate_periods"
    __table_args__ = (
        UniqueConstraint("policy_id", "effective_from", name="uq_interest_rate_effective_from"),
    )

    rate_period_id: Optional[int] = Field(default=None, primary_key=True)
    policy_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("interest_policies.policy_id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    annual_rate: Decimal = Field(max_digits=9, decimal_places=6)
    effective_from: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))


class InterestExecution(SQLModel, table=True):
    """Auditable result for one settled interest period."""

    __tablename__ = "interest_executions"
    __table_args__ = (
        UniqueConstraint(
            "policy_id",
            "period_start",
            "period_end",
            name="uq_interest_execution_period",
        ),
    )

    execution_id: Optional[int] = Field(default=None, primary_key=True)
    policy_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("interest_policies.policy_id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    rule_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("rules.rule_id", ondelete="SET NULL"), nullable=True),
    )
    period_start: datetime
    period_end: datetime
    eligible_balance: Decimal = Field(default=Decimal("0.00"), max_digits=18, decimal_places=2)
    annual_rate: Decimal = Field(max_digits=9, decimal_places=6)
    days: int
    accrued_amount: Decimal = Field(max_digits=15, decimal_places=2)
    treatment: str = Field(max_length=20)
    status: str = Field(default=InterestExecutionStatus.SUCCESS.value, max_length=20)
    transaction_id: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
