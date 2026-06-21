from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from decimal import Decimal
from sqlmodel import Session
import logging

from app.models.account import Account, AccountType
from app.models.rule import Rule, RuleType
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
                "loan_amount": float(0.0)
            }
            
            if account.metadata_:
                if account.account_type == AccountType.SAVINGS:
                    context["interest_rate"] = float(account.metadata_.get("interest_rate", 0.0))
                    context["min_balance"] = float(account.metadata_.get("min_balance", 0.0))
            
                elif account.account_type == AccountType.LOAN:
                    context["loan_amount"] = float(account.metadata_.get("loan_amount", 0.0))
                    context["interest_rate"] = float(account.metadata_.get("interest_rate", 0.0))
                    
                elif account.account_type == AccountType.FIXED_DEPOSIT:
                    context["principal_amount"] = float(account.metadata_.get("principal_amount", 0.0))
                    context["interest_rate"] = float(account.metadata_.get("interest_rate", 0.0))
                    
                elif account.account_type == AccountType.RECURRING_DEPOSIT:
                    context["interest_rate"] = float(account.metadata_.get("interest_rate", 0.0))
            
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

class RuleProcessorFactory:
    @staticmethod
    def get_strategy(rule_type: str) -> RuleEvaluationStrategy:
        if rule_type == RuleType.CALCULATION:
            return CalculationRuleStrategy()
        else:
            return TransactionRuleStrategy()
