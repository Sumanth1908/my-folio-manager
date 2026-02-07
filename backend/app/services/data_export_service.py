"""Service for exporting and importing user data."""
import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlmodel import Session, select

from app.models import (
    Account,
    Category,
    FixedDepositAccount,
    InvestmentHolding,
    LoanAccount,
    Rule,
    SavingsAccount,
    Settings,
    Transaction,
)


class DataExportService:
    """Service for handling data export and import operations."""

    EXPORT_VERSION = "1.0.0"

    @staticmethod
    def _serialize_value(value: Any) -> Any:
        """Convert special types to JSON-serializable format."""
        if isinstance(value, Decimal):
            return float(value)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, date):
            return value.isoformat()
        return value

    @staticmethod
    def _model_to_dict(model: Any) -> dict:
        """Convert a SQLModel instance to a dictionary."""
        return {
            key: DataExportService._serialize_value(value)
            for key, value in model.model_dump().items()
        }

    def export_user_data(self, session: Session, user_id: str) -> dict:
        """
        Export all user data to a JSON-serializable dictionary.
        
        Args:
            session: Database session
            user_id: User ID to export data for
            
        Returns:
            Dictionary containing all user data
        """
        # Get user settings
        settings = session.exec(
            select(Settings).where(Settings.user_id == user_id)
        ).first()

        # Get categories
        categories = session.exec(
            select(Category).where(Category.user_id == user_id)
        ).all()

        # Get accounts
        accounts = session.exec(
            select(Account).where(Account.user_id == user_id)
        ).all()

        # Collect account IDs for related data
        account_ids = [acc.account_id for acc in accounts]

        # Get account-specific details
        savings_accounts = session.exec(
            select(SavingsAccount).where(SavingsAccount.account_id.in_(account_ids))
        ).all()

        loan_accounts = session.exec(
            select(LoanAccount).where(LoanAccount.account_id.in_(account_ids))
        ).all()

        fixed_deposit_accounts = session.exec(
            select(FixedDepositAccount).where(FixedDepositAccount.account_id.in_(account_ids))
        ).all()

        investment_holdings = session.exec(
            select(InvestmentHolding).where(InvestmentHolding.account_id.in_(account_ids))
        ).all()

        # Get transactions
        transactions = session.exec(
            select(Transaction).where(Transaction.account_id.in_(account_ids))
        ).all()

        # Get rules
        rules = session.exec(
            select(Rule).where(Rule.account_id.in_(account_ids))
        ).all()

        # Build export data
        export_data = {
            "export_version": self.EXPORT_VERSION,
            "exported_at": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "data": {
                "settings": self._model_to_dict(settings) if settings else None,
                "categories": [self._model_to_dict(cat) for cat in categories],
                "accounts": [self._model_to_dict(acc) for acc in accounts],
                "savings_accounts": [self._model_to_dict(sa) for sa in savings_accounts],
                "loan_accounts": [self._model_to_dict(la) for la in loan_accounts],
                "fixed_deposit_accounts": [self._model_to_dict(fda) for fda in fixed_deposit_accounts],
                "investment_holdings": [self._model_to_dict(ih) for ih in investment_holdings],
                "transactions": [self._model_to_dict(tx) for tx in transactions],
                "rules": [self._model_to_dict(rule) for rule in rules],
            }
        }

        return export_data

    def import_user_data(self, session: Session, user_id: str, import_data: dict, clear_existing: bool = False) -> dict:
        """
        Import user data from an exported snapshot.
        
        Args:
            session: Database session
            user_id: User ID to import data for
            import_data: The exported data dictionary
            clear_existing: If True, delete all existing user data before import
            
        Returns:
            Summary of imported data
        """
        if "export_version" not in import_data or "data" not in import_data:
            raise ValueError("Invalid import file format")

        data = import_data["data"]
        
        # Mapping of old IDs to new IDs
        category_id_map: dict[int, int] = {}
        account_id_map: dict[str, str] = {}

        if clear_existing:
            # Delete existing data in reverse dependency order
            self._delete_user_data(session, user_id)

        summary = {
            "categories": 0,
            "accounts": 0,
            "savings_accounts": 0,
            "loan_accounts": 0,
            "fixed_deposit_accounts": 0,
            "investment_holdings": 0,
            "transactions": 0,
            "rules": 0,
        }

        # Import settings
        if data.get("settings"):
            settings_data = data["settings"]
            existing_settings = session.exec(
                select(Settings).where(Settings.user_id == user_id)
            ).first()
            
            if existing_settings:
                existing_settings.default_currency = settings_data.get("default_currency", "USD")
                existing_settings.exchange_provider = settings_data.get("exchange_provider", "Manual")
                session.add(existing_settings)
            else:
                new_settings = Settings(
                    user_id=user_id,
                    default_currency=settings_data.get("default_currency", "USD"),
                    exchange_provider=settings_data.get("exchange_provider", "Manual"),
                )
                session.add(new_settings)

        # Import categories
        for cat_data in data.get("categories", []):
            old_id = cat_data.get("category_id")
            new_category = Category(
                user_id=user_id,
                name=cat_data["name"],
            )
            session.add(new_category)
            session.flush()  # Get the new ID
            category_id_map[old_id] = new_category.category_id
            summary["categories"] += 1

        # Import accounts
        for acc_data in data.get("accounts", []):
            old_id = acc_data.get("account_id")
            new_account = Account(
                user_id=user_id,
                account_type=acc_data["account_type"],
                account_name=acc_data.get("account_name"),
                currency=acc_data.get("currency", "USD"),
                status=acc_data.get("status", "Active"),
                is_interest_enabled=acc_data.get("is_interest_enabled", False),
            )
            session.add(new_account)
            session.flush()
            account_id_map[old_id] = new_account.account_id
            summary["accounts"] += 1

        # Import savings accounts
        for sa_data in data.get("savings_accounts", []):
            old_account_id = sa_data.get("account_id")
            new_account_id = account_id_map.get(old_account_id)
            if new_account_id:
                new_sa = SavingsAccount(
                    account_id=new_account_id,
                    balance=Decimal(str(sa_data.get("balance", 0))),
                    interest_rate=Decimal(str(sa_data["interest_rate"])) if sa_data.get("interest_rate") else None,
                    min_balance=Decimal(str(sa_data.get("min_balance", 0))),
                    interest_accrual_day=sa_data.get("interest_accrual_day", 1),
                )
                session.add(new_sa)
                summary["savings_accounts"] += 1

        # Import loan accounts
        for la_data in data.get("loan_accounts", []):
            old_account_id = la_data.get("account_id")
            new_account_id = account_id_map.get(old_account_id)
            if new_account_id:
                new_la = LoanAccount(
                    account_id=new_account_id,
                    loan_amount=Decimal(str(la_data["loan_amount"])),
                    outstanding_amount=Decimal(str(la_data.get("outstanding_amount", 0))),
                    interest_rate=Decimal(str(la_data["interest_rate"])),
                    tenure_months=la_data["tenure_months"],
                    emi_amount=Decimal(str(la_data["emi_amount"])),
                    start_date=date.fromisoformat(la_data["start_date"]),
                    interest_accrual_day=la_data.get("interest_accrual_day", 1),
                )
                session.add(new_la)
                summary["loan_accounts"] += 1

        # Import fixed deposit accounts
        for fda_data in data.get("fixed_deposit_accounts", []):
            old_account_id = fda_data.get("account_id")
            new_account_id = account_id_map.get(old_account_id)
            if new_account_id:
                new_fda = FixedDepositAccount(
                    account_id=new_account_id,
                    principal_amount=Decimal(str(fda_data["principal_amount"])),
                    interest_rate=Decimal(str(fda_data["interest_rate"])),
                    start_date=date.fromisoformat(fda_data["start_date"]),
                    maturity_date=date.fromisoformat(fda_data["maturity_date"]),
                    maturity_amount=Decimal(str(fda_data["maturity_amount"])),
                    interest_accrual_day=fda_data.get("interest_accrual_day", 1),
                )
                session.add(new_fda)
                summary["fixed_deposit_accounts"] += 1

        # Import investment holdings
        for ih_data in data.get("investment_holdings", []):
            old_account_id = ih_data.get("account_id")
            new_account_id = account_id_map.get(old_account_id)
            if new_account_id:
                new_ih = InvestmentHolding(
                    account_id=new_account_id,
                    symbol=ih_data["symbol"],
                    name=ih_data["name"],
                    quantity=Decimal(str(ih_data["quantity"])),
                    average_price=Decimal(str(ih_data["average_price"])),
                    current_price=Decimal(str(ih_data["current_price"])) if ih_data.get("current_price") else None,
                    currency=ih_data.get("currency", "USD"),
                    stock_exchange=ih_data.get("stock_exchange"),
                    last_price_update=datetime.fromisoformat(ih_data["last_price_update"]) if ih_data.get("last_price_update") else None,
                )
                session.add(new_ih)
                summary["investment_holdings"] += 1

        # Import transactions
        for tx_data in data.get("transactions", []):
            old_account_id = tx_data.get("account_id")
            new_account_id = account_id_map.get(old_account_id)
            if new_account_id:
                old_category_id = tx_data.get("category_id")
                new_category_id = category_id_map.get(old_category_id) if old_category_id else None
                
                new_tx = Transaction(
                    account_id=new_account_id,
                    amount=Decimal(str(tx_data["amount"])),
                    transaction_type=tx_data["transaction_type"],
                    currency=tx_data.get("currency", "USD"),
                    description=tx_data.get("description"),
                    category_id=new_category_id,
                    transaction_date=datetime.fromisoformat(tx_data["transaction_date"]) if tx_data.get("transaction_date") else datetime.utcnow(),
                )
                session.add(new_tx)
                summary["transactions"] += 1

        # Import rules
        for rule_data in data.get("rules", []):
            old_account_id = rule_data.get("account_id")
            new_account_id = account_id_map.get(old_account_id)
            if new_account_id:
                old_category_id = rule_data.get("category_id")
                new_category_id = category_id_map.get(old_category_id) if old_category_id else None
                
                old_target_account_id = rule_data.get("target_account_id")
                new_target_account_id = account_id_map.get(old_target_account_id) if old_target_account_id else None

                new_rule = Rule(
                    account_id=new_account_id,
                    name=rule_data["name"],
                    rule_type=rule_data.get("rule_type", "CATEGORIZATION"),
                    description_contains=rule_data.get("description_contains"),
                    category_id=new_category_id,
                    frequency=rule_data.get("frequency"),
                    next_run_at=datetime.fromisoformat(rule_data["next_run_at"]) if rule_data.get("next_run_at") else None,
                    transaction_amount=Decimal(str(rule_data["transaction_amount"])) if rule_data.get("transaction_amount") else None,
                    transaction_type=rule_data.get("transaction_type"),
                    target_account_id=new_target_account_id,
                    formula=rule_data.get("formula"),
                    is_active=rule_data.get("is_active", True),
                )
                session.add(new_rule)
                summary["rules"] += 1

        session.commit()
        return summary

    def _delete_user_data(self, session: Session, user_id: str) -> None:
        """Delete all user data before import."""
        # Get all user accounts
        accounts = session.exec(
            select(Account).where(Account.user_id == user_id)
        ).all()
        account_ids = [acc.account_id for acc in accounts]

        # Delete in dependency order
        if account_ids:
            # Delete rules
            rules = session.exec(
                select(Rule).where(Rule.account_id.in_(account_ids))
            ).all()
            for rule in rules:
                session.delete(rule)

            # Delete transactions
            transactions = session.exec(
                select(Transaction).where(Transaction.account_id.in_(account_ids))
            ).all()
            for tx in transactions:
                session.delete(tx)

            # Delete investment holdings
            holdings = session.exec(
                select(InvestmentHolding).where(InvestmentHolding.account_id.in_(account_ids))
            ).all()
            for holding in holdings:
                session.delete(holding)

            # Delete account-specific tables
            for acc in accounts:
                if acc.account_type == "SAVINGS":
                    sa = session.get(SavingsAccount, acc.account_id)
                    if sa:
                        session.delete(sa)
                elif acc.account_type == "LOAN":
                    la = session.get(LoanAccount, acc.account_id)
                    if la:
                        session.delete(la)
                elif acc.account_type == "FIXED_DEPOSIT":
                    fda = session.get(FixedDepositAccount, acc.account_id)
                    if fda:
                        session.delete(fda)

            # Delete accounts
            for acc in accounts:
                session.delete(acc)

        # Delete categories
        categories = session.exec(
            select(Category).where(Category.user_id == user_id)
        ).all()
        for cat in categories:
            session.delete(cat)

        session.flush()


# Singleton instance
data_export_service = DataExportService()
