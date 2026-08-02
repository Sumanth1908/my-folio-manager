from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.interest import (
    InterestBalanceBasis,
    InterestDayCount,
    InterestDirection,
    InterestExecutionStatus,
    InterestTreatment,
)
from app.schemas.rule import RuleFrequency


def _naive_utc(value: Optional[datetime]) -> Optional[datetime]:
    """Normalize API datetimes to the naive-UTC convention used by the DB."""
    if value is not None and value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


class InterestPolicyBase(BaseModel):
    enabled: bool = True
    direction: InterestDirection = InterestDirection.EARNED
    annual_rate: Decimal = Field(ge=0, le=1000, max_digits=9, decimal_places=6)
    balance_basis: InterestBalanceBasis = InterestBalanceBasis.LEDGER_BALANCE
    day_count: InterestDayCount = InterestDayCount.ACTUAL_365
    treatment: InterestTreatment = InterestTreatment.CAPITALIZE
    settlement_frequency: RuleFrequency = RuleFrequency.MONTHLY
    payout_account_id: Optional[str] = None
    category_id: Optional[int] = None
    effective_from: datetime
    end_date: Optional[datetime] = None

    @field_validator("effective_from", "end_date")
    @classmethod
    def normalize_datetime(cls, value: Optional[datetime]) -> Optional[datetime]:
        return _naive_utc(value)

    @model_validator(mode="after")
    def validate_terms(self):
        if self.treatment == InterestTreatment.PAYOUT and self.direction != InterestDirection.EARNED:
            raise ValueError("Payout treatment is only valid for earned interest")
        if self.treatment == InterestTreatment.INTEREST_DUE and self.direction != InterestDirection.CHARGED:
            raise ValueError("Interest-due treatment requires charged interest")
        if self.end_date and self.end_date <= self.effective_from:
            raise ValueError("Interest end date must be after the effective date")
        if self.settlement_frequency == RuleFrequency.ONE_TIME and not self.end_date:
            raise ValueError("One-time interest settlement requires an end date")
        if self.settlement_frequency in {RuleFrequency.DAILY, RuleFrequency.WEEKLY}:
            # The engine supports these internally, but the first product UI is
            # intentionally limited to common banking settlement schedules.
            return self
        return self


class InterestPolicyCreate(InterestPolicyBase):
    pass


class InterestPolicyUpdate(BaseModel):
    enabled: Optional[bool] = None
    direction: Optional[InterestDirection] = None
    annual_rate: Optional[Decimal] = Field(default=None, ge=0, le=1000, max_digits=9, decimal_places=6)
    balance_basis: Optional[InterestBalanceBasis] = None
    day_count: Optional[InterestDayCount] = None
    treatment: Optional[InterestTreatment] = None
    settlement_frequency: Optional[RuleFrequency] = None
    payout_account_id: Optional[str] = None
    category_id: Optional[int] = None
    effective_from: Optional[datetime] = None
    end_date: Optional[datetime] = None

    @field_validator("effective_from", "end_date")
    @classmethod
    def normalize_datetime(cls, value: Optional[datetime]) -> Optional[datetime]:
        return _naive_utc(value)


class InterestPolicyRead(InterestPolicyBase):
    model_config = ConfigDict(from_attributes=True)

    policy_id: int
    account_id: str
    calculation_version: int
    created_at: datetime
    updated_at: datetime


class InterestExecutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    execution_id: int
    policy_id: int
    rule_id: Optional[int] = None
    period_start: datetime
    period_end: datetime
    eligible_balance: Decimal
    annual_rate: Decimal
    days: int
    accrued_amount: Decimal
    treatment: InterestTreatment
    status: InterestExecutionStatus
    transaction_id: Optional[int] = None
    created_at: datetime


class InterestPreviewRequest(BaseModel):
    account_type: str
    currency: str = "USD"
    metadata_: dict = Field(default_factory=dict)
    policy: InterestPolicyCreate


class InterestPreview(BaseModel):
    period_start: datetime
    period_end: datetime
    days: int
    eligible_balance: Decimal
    estimated_interest: Decimal
    projected_maturity_amount: Optional[Decimal] = None
    calculation_version: int = 1
