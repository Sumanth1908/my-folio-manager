"""Service for exporting and importing user data."""
import json
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from sqlmodel import Session, select

from app.models import (
    Account,
    Category,
    InvestmentHolding,
    Rule,
    Settings,
    Transaction,
)


class DataExportService:
    """Service for handling data export and import operations."""

    EXPORT_VERSION = "1.2.0"

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
        settings = session.exec(
            select(Settings).where(Settings.user_id == user_id)
        ).first()

        categories = session.exec(
            select(Category).where(Category.user_id == user_id)
        ).all()

        accounts = session.exec(
            select(Account).where(Account.user_id == user_id)
        ).all()

        account_ids = [acc.account_id for acc in accounts]

        investment_holdings = session.exec(
            select(InvestmentHolding).where(InvestmentHolding.account_id.in_(account_ids))
        ).all()

        transactions = session.exec(
            select(Transaction).where(Transaction.account_id.in_(account_ids))
        ).all()

        rules = session.exec(
            select(Rule).where(Rule.account_id.in_(account_ids))
        ).all()

        export_data = {
            "export_version": self.EXPORT_VERSION,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "data": {
                "settings": self._model_to_dict(settings) if settings else None,
                "categories": [self._model_to_dict(cat) for cat in categories],
                "accounts": [self._model_to_dict(acc) for acc in accounts],
                "investment_holdings": [self._model_to_dict(ih) for ih in investment_holdings],
                "transactions": [self._model_to_dict(tx) for tx in transactions],
                "rules": [self._model_to_dict(rule) for rule in rules],
            }
        }

        return export_data

    def import_user_data(self, session: Session, user_id: str, import_data: dict, clear_existing: bool = False) -> dict:
        """
        Import user data from an exported snapshot.
        """
        if "export_version" not in import_data or "data" not in import_data:
            raise ValueError("Invalid import file format")

        data = import_data["data"]
        
        category_id_map: dict[int, int] = {}
        account_id_map: dict[str, str] = {}

        if clear_existing:
            self._delete_user_data(session, user_id)

        summary = {
            "categories": 0,
            "accounts": 0,
            "investment_holdings": 0,
            "transactions": 0,
            "rules": 0,
        }

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

        for cat_data in data.get("categories", []):
            old_id = cat_data.get("category_id")
            new_category = Category(
                user_id=user_id,
                name=cat_data["name"],
            )
            session.add(new_category)
            session.flush() 
            category_id_map[old_id] = new_category.category_id
            summary["categories"] += 1

        for acc_data in data.get("accounts", []):
            old_id = acc_data.get("account_id")
            new_account = Account(
                user_id=user_id,
                account_type=acc_data["account_type"],
                account_name=acc_data.get("account_name"),
                currency=acc_data.get("currency", "USD"),
                status=acc_data.get("status", "Active"),
                is_interest_enabled=acc_data.get("is_interest_enabled", False),
                metadata_=acc_data.get("metadata_", {}),
            )
            session.add(new_account)
            session.flush()
            account_id_map[old_id] = new_account.account_id
            summary["accounts"] += 1

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
                    asset_type=ih_data.get("asset_type", "EQUITY"),
                    unit=ih_data.get("unit", "unit"),
                    price_source=ih_data.get("price_source", "MARKET"),
                    metadata_=ih_data.get("metadata_"),
                )
                session.add(new_ih)
                summary["investment_holdings"] += 1

        for tx_data in data.get("transactions", []):
            old_account_id = tx_data.get("account_id")
            new_account_id = account_id_map.get(old_account_id)
            if new_account_id:
                old_category_id = tx_data.get("category_id")
                new_category_id = category_id_map.get(old_category_id) if old_category_id else None
                
                # Handling old exports which might have transaction_type
                amount = Decimal(str(tx_data["amount"]))
                if "transaction_type" in tx_data and tx_data["transaction_type"] == "DEBIT":
                    amount = -abs(amount)
                
                new_tx = Transaction(
                    account_id=new_account_id,
                    amount=amount,
                    currency=tx_data.get("currency", "USD"),
                    description=tx_data.get("description"),
                    category_id=new_category_id,
                    transaction_date=datetime.fromisoformat(tx_data["transaction_date"]) if tx_data.get("transaction_date") else datetime.now(timezone.utc),
                )
                session.add(new_tx)
                summary["transactions"] += 1

        for rule_data in data.get("rules", []):
            old_account_id = rule_data.get("account_id")
            new_account_id = account_id_map.get(old_account_id)
            if new_account_id:
                new_rule = Rule(
                    account_id=new_account_id,
                    name=rule_data["name"],
                    rule_type=rule_data.get("rule_type", "CATEGORIZATION"),
                    configuration=rule_data.get("configuration", {}),
                    next_run_at=datetime.fromisoformat(rule_data["next_run_at"]) if rule_data.get("next_run_at") else None,
                    is_active=rule_data.get("is_active", True),
                )
                session.add(new_rule)
                summary["rules"] += 1

        session.commit()
        return summary

    def _delete_user_data(self, session: Session, user_id: str) -> None:
        """Delete all user data before import."""
        accounts = session.exec(
            select(Account).where(Account.user_id == user_id)
        ).all()
        account_ids = [acc.account_id for acc in accounts]

        if account_ids:
            rules = session.exec(
                select(Rule).where(Rule.account_id.in_(account_ids))
            ).all()
            for rule in rules:
                session.delete(rule)

            transactions = session.exec(
                select(Transaction).where(Transaction.account_id.in_(account_ids))
            ).all()
            for tx in transactions:
                session.delete(tx)

            holdings = session.exec(
                select(InvestmentHolding).where(InvestmentHolding.account_id.in_(account_ids))
            ).all()
            for holding in holdings:
                session.delete(holding)

            for acc in accounts:
                session.delete(acc)

        categories = session.exec(
            select(Category).where(Category.user_id == user_id)
        ).all()
        for cat in categories:
            session.delete(cat)

        session.flush()

data_export_service = DataExportService()
