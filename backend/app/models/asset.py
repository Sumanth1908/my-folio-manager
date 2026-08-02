from enum import Enum


class AssetType(str, Enum):
    """Built-in holding classes.

    Holdings use a string column in the database, so adding another class does not
    require a database enum migration.  These values are the supported defaults;
    callers may also use a custom, normalized identifier.
    """

    EQUITY = "EQUITY"
    ETF = "ETF"
    MUTUAL_FUND = "MUTUAL_FUND"
    BOND = "BOND"
    GOLD = "GOLD"
    SILVER = "SILVER"
    COMMODITY = "COMMODITY"
    CRYPTO = "CRYPTO"
    REAL_ESTATE = "REAL_ESTATE"
    COLLECTIBLE = "COLLECTIBLE"
    OTHER = "OTHER"


class PriceSource(str, Enum):
    MANUAL = "MANUAL"
    MARKET = "MARKET"

