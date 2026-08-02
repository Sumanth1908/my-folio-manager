from abc import ABC, abstractmethod
from typing import Dict
from decimal import Decimal
from sqlmodel import Session, select
import logging

from app.models.account import Account, AccountType
from app.models.rule import Rule, RuleType
from app.models.interest import InterestPolicy
from app.core.expression_engine import SafeEquationEvaluator

logger = logging.getLogger(__name__)

class RuleEvaluationStrategy(ABC):
    @abstractmethod
    def evaluate(self, session: Session, rule: Rule, account: Account, avg_balance: Decimal, days_to_post: int) -> Decimal:
        pass

class CalculationRuleStrategy(RuleEvaluationStrategy):
    def evaluate(self, session: Session, rule: Rule, account: Account, avg_balance: Decimal, days_to_post: int) -> Decimal:
        formula = rule.configuration.get("formula") if rule.configuration else None
        if not formula:
            return Decimal("0.00")
            
        try:
            context = {
                "balance": float(avg_balance),
                "days": float(days_to_post),
                "interest_rate": float(0.0),
                "principal_amount": float(0.0),
                "loan_amount": float(0.0),
                "deposit_amount": float(0.0),
                "outstanding_amount": float(0.0),
            }

            managed_policy = session.exec(
                select(InterestPolicy).where(InterestPolicy.account_id == account.account_id)
            ).first()
            if managed_policy:
                context["interest_rate"] = float(managed_policy.annual_rate)
            
            if account.metadata_:
                if account.account_type == AccountType.SAVINGS:
                    context["min_balance"] = float(account.metadata_.get("min_balance", 0.0))
            
                elif account.account_type == AccountType.LOAN:
                    context["loan_amount"] = float(account.metadata_.get("loan_amount", 0.0))
                    context["outstanding_amount"] = float(account.metadata_.get("outstanding_amount", 0.0))
                    
                elif account.account_type == AccountType.FIXED_DEPOSIT:
                    context["principal_amount"] = float(account.metadata_.get("principal_amount", 0.0))
                    
                elif account.account_type == AccountType.RECURRING_DEPOSIT:
                    context["deposit_amount"] = float(account.metadata_.get("deposit_amount", 0.0))
            
            evaluator = SafeEquationEvaluator()
            calculated_value = evaluator.evaluate(formula, context)
            return Decimal(str(calculated_value)).quantize(Decimal("0.01"))
            
        except Exception as e:
            logger.error(f"Failed to evaluate formula for rule {rule.rule_id}: {e}")
            raise e

class TransactionRuleStrategy(RuleEvaluationStrategy):
    def evaluate(self, session: Session, rule: Rule, account: Account, avg_balance: Decimal, days_to_post: int) -> Decimal:
        config = rule.configuration or {}
        transaction_amount = Decimal(str(config.get("transaction_amount", "0.00")))
        frequency = config.get("frequency")
        if frequency == "DAILY":
            transaction_amount *= Decimal(str(days_to_post))
        return transaction_amount


class InterestRuleStrategy(RuleEvaluationStrategy):
    """Marker strategy for managed interest rules.

    The full lifecycle is handled by rules_service.process_interest_rule because
    it can create several sequential settlements when the scheduler catches up.
    """
    def evaluate(self, session: Session, rule: Rule, account: Account, avg_balance: Decimal, days_to_post: int) -> Decimal:
        return Decimal("0.00")

# Single registry: adding a new schedulable rule type means registering its
# strategy here — the scheduler query and manual-execute checks derive from it.
STRATEGY_REGISTRY: Dict[RuleType, type] = {
    RuleType.CALCULATION: CalculationRuleStrategy,
    RuleType.TRANSACTION: TransactionRuleStrategy,
    RuleType.INTEREST: InterestRuleStrategy,
}

SCHEDULABLE_RULE_TYPES = list(STRATEGY_REGISTRY.keys())


class RuleProcessorFactory:
    @staticmethod
    def get_strategy(rule_type: str) -> RuleEvaluationStrategy:
        strategy_cls = STRATEGY_REGISTRY.get(rule_type)
        if strategy_cls is None:
            raise ValueError(f"No execution strategy registered for rule type '{rule_type}'")
        return strategy_cls()
