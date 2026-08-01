from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, Dict, Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.expression_engine import SafeEquationEvaluator
from app.models.rule import RuleType
from app.models.rule_execution import RuleExecutionStatus


class RuleFrequency(str, Enum):
    ONE_TIME = "ONE_TIME"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"


class CategorizationConfig(BaseModel):
    """Configuration for CATEGORIZATION rules."""
    model_config = ConfigDict(extra="allow")

    description_contains: str = Field(min_length=1)
    category_id: int


class TransactionRuleConfig(BaseModel):
    """Configuration for TRANSACTION rules (scheduled fixed postings)."""
    model_config = ConfigDict(extra="allow")

    transaction_amount: Decimal = Field(gt=0)
    frequency: RuleFrequency
    source_account_id: Optional[str] = None
    target_account_id: Optional[str] = None
    category_id: Optional[int] = None
    is_debit: bool = False
    end_date: Optional[datetime] = None


class CalculationRuleConfig(BaseModel):
    """Configuration for CALCULATION rules (formula-driven postings)."""
    model_config = ConfigDict(extra="allow")

    formula: str = Field(min_length=1)
    frequency: RuleFrequency
    source_account_id: Optional[str] = None
    target_account_id: Optional[str] = None
    category_id: Optional[int] = None
    is_debit: bool = False
    end_date: Optional[datetime] = None


CONFIG_MODELS = {
    RuleType.CATEGORIZATION: CategorizationConfig,
    RuleType.TRANSACTION: TransactionRuleConfig,
    RuleType.CALCULATION: CalculationRuleConfig,
}

# Every variable the formula context can provide (see CalculationRuleStrategy).
FORMULA_VARIABLES = {
    "balance": 1.0,
    "days": 1.0,
    "interest_rate": 1.0,
    "principal_amount": 1.0,
    "loan_amount": 1.0,
    "min_balance": 1.0,
}


def validate_rule_configuration(rule_type: RuleType, configuration: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate a rule's configuration blob against its rule_type.

    Raises ValueError with a user-readable message when invalid. Returns the
    original dict (extra keys preserved) so stored configuration stays intact.
    """
    config = configuration or {}
    model = CONFIG_MODELS.get(rule_type)
    if model is None:
        raise ValueError(f"Unknown rule type: {rule_type}")

    try:
        parsed = model.model_validate(config)
    except Exception as e:
        raise ValueError(f"Invalid configuration for {rule_type.value} rule: {e}")

    if rule_type == RuleType.CALCULATION:
        # Fail bad formulas at creation time, not inside the scheduler at 1 AM.
        SafeEquationEvaluator().evaluate(parsed.formula, FORMULA_VARIABLES)

    return config


class RuleBase(BaseModel):
    name: str
    rule_type: RuleType = RuleType.CATEGORIZATION
    is_active: bool = True
    next_run_at: Optional[datetime] = None
    configuration: Optional[Dict[str, Any]] = Field(default_factory=dict)

class RuleCreate(RuleBase):
    account_id: str

class RuleRead(RuleBase):
    rule_id: int
    account_id: str
    category_name: Optional[str] = None

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    rule_type: Optional[RuleType] = None
    is_active: Optional[bool] = None
    next_run_at: Optional[datetime] = None
    configuration: Optional[Dict[str, Any]] = None


class RuleExecutionRead(BaseModel):
    execution_id: int
    rule_id: int
    ran_at: datetime
    status: RuleExecutionStatus
    amount: Optional[Decimal] = None
    transaction_id: Optional[int] = None
    transfer_id: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True


class RulePreview(BaseModel):
    """Result of a dry-run: what the rule would post right now."""
    rule_id: int
    amount: Decimal
    is_debit: bool
    description: str
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    days: int
    from_account_id: Optional[str] = None
    to_account_id: Optional[str] = None
