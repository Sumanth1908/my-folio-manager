from dataclasses import asdict, dataclass
from enum import Enum
import re
from typing import Any

from app.models.account import AccountType


class AccountNature(str, Enum):
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"


@dataclass(frozen=True)
class AccountTypeDefinition:
    key: str
    label: str
    nature: AccountNature = AccountNature.ASSET
    supports_holdings: bool = False
    supports_interest: bool = False
    valuation_mode: str = "LEDGER"

    def model_dump(self) -> dict[str, Any]:
        result = asdict(self)
        result["nature"] = self.nature.value
        return result


ACCOUNT_TYPE_DEFINITIONS = {
    definition.key: definition
    for definition in (
        AccountTypeDefinition(AccountType.SAVINGS.value, "Savings", supports_interest=True),
        AccountTypeDefinition(AccountType.CASH.value, "Cash"),
        AccountTypeDefinition(
            AccountType.INVESTMENT.value,
            "Investment",
            supports_holdings=True,
            valuation_mode="HOLDINGS",
        ),
        AccountTypeDefinition(
            AccountType.LOAN.value,
            "Loan",
            nature=AccountNature.LIABILITY,
            supports_interest=True,
        ),
        AccountTypeDefinition(AccountType.FIXED_DEPOSIT.value, "Fixed deposit", supports_interest=True),
        AccountTypeDefinition(AccountType.RECURRING_DEPOSIT.value, "Recurring deposit", supports_interest=True),
        AccountTypeDefinition(
            AccountType.COMMODITY.value,
            "Commodity / precious metal",
            supports_holdings=True,
            valuation_mode="HOLDINGS",
        ),
        AccountTypeDefinition(
            AccountType.CRYPTO.value,
            "Crypto asset",
            supports_holdings=True,
            valuation_mode="HOLDINGS",
        ),
        AccountTypeDefinition(
            AccountType.REAL_ESTATE.value,
            "Real estate",
            supports_holdings=True,
            valuation_mode="HOLDINGS",
        ),
        AccountTypeDefinition(
            AccountType.OTHER_ASSET.value,
            "Other asset",
            supports_holdings=True,
            valuation_mode="HOLDINGS",
        ),
    )
}

_TYPE_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]{1,39}$")


def normalize_account_type(value: str | AccountType) -> str:
    """Normalize built-in and custom account identifiers for stable storage."""
    normalized = str(value.value if isinstance(value, AccountType) else value).strip().upper().replace(" ", "_")
    if not _TYPE_PATTERN.fullmatch(normalized):
        raise ValueError(
            "account_type must be 2-40 characters and contain only letters, numbers, and underscores"
        )
    return normalized


def get_account_type_definition(account_type: str | AccountType, metadata: dict | None = None) -> AccountTypeDefinition:
    key = normalize_account_type(account_type)
    definition = ACCOUNT_TYPE_DEFINITIONS.get(key)
    if definition:
        return definition

    # Unknown types remain useful without code or schema changes.  Their optional
    # capabilities live in account metadata; the conservative default is a ledger
    # asset so an unexpected type cannot trigger holdings or liability behavior.
    metadata = metadata or {}
    return AccountTypeDefinition(
        key=key,
        label=str(metadata.get("type_label") or key.replace("_", " ").title()),
        nature=(
            AccountNature.LIABILITY
            if str(metadata.get("nature", "ASSET")).upper() == AccountNature.LIABILITY
            else AccountNature.ASSET
        ),
        supports_holdings=bool(metadata.get("supports_holdings", False)),
        supports_interest=bool(metadata.get("supports_interest", False)),
        valuation_mode="HOLDINGS" if metadata.get("supports_holdings", False) else "LEDGER",
    )


def list_account_type_definitions() -> list[dict[str, Any]]:
    return [definition.model_dump() for definition in ACCOUNT_TYPE_DEFINITIONS.values()]
