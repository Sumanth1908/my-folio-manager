from decimal import Decimal

from sqlmodel import select

from app.models import AccountType, AssetType, InvestmentHolding, PriceSource, Transaction
from app.schemas.account import AccountCreate
from app.schemas.investment import InvestmentHoldingCreate
from app.services import account_service, investment_service, portfolio_service
from app.services.account_types import get_account_type_definition, list_account_type_definitions


def test_account_types_are_normalized_and_extensible():
    account = AccountCreate(account_name="Pension", account_type="private pension")

    assert account.account_type == "PRIVATE_PENSION"
    definition = get_account_type_definition(account.account_type)
    assert definition.label == "Private Pension"
    assert definition.supports_holdings is False

    built_in_types = {item["key"] for item in list_account_type_definitions()}
    assert {
        AccountType.FIXED_DEPOSIT.value,
        AccountType.COMMODITY.value,
        AccountType.CRYPTO.value,
        AccountType.REAL_ESTATE.value,
        AccountType.OTHER_ASSET.value,
    }.issubset(built_in_types)


def test_gold_holding_is_supported_and_valued(session, user):
    account = account_service.create_account(
        session,
        AccountCreate(
            account_name="Physical gold",
            account_type=AccountType.COMMODITY.value,
            currency="INR",
        ),
        user.user_id,
    )

    holding = investment_service.buy_holding(
        session,
        InvestmentHoldingCreate(
            account_id=account.account_id,
            symbol="GOLD_24K",
            name="24K gold",
            asset_type=AssetType.GOLD.value,
            quantity=Decimal("12.5"),
            unit="gram",
            average_price=Decimal("7000"),
            current_price=Decimal("7500"),
            currency="INR",
            price_source=PriceSource.MANUAL.value,
            metadata_={"purity": "999"},
        ),
        user.user_id,
    )

    assert holding.asset_type == AssetType.GOLD.value
    assert holding.unit == "gram"
    assert account_service.calculate_asset_value(session, account) == Decimal("93750.000000")

    enriched = account_service.enrich_account(session, account)
    assert enriched.asset_value == Decimal("93750.000000")
    assert enriched.net_value == enriched.asset_value
    assert enriched.asset_holdings[0].metadata_ == {"purity": "999"}


def test_portfolio_includes_non_stock_asset_accounts(session, user):
    account = account_service.create_account(
        session,
        AccountCreate(account_name="Gold", account_type="COMMODITY", currency="INR"),
        user.user_id,
    )
    session.add(
        InvestmentHolding(
            account_id=account.account_id,
            symbol="GOLD",
            name="Gold",
            asset_type="GOLD",
            unit="gram",
            quantity=Decimal("2"),
            average_price=Decimal("6000"),
            current_price=Decimal("6500"),
            currency="INR",
            price_source="MANUAL",
        )
    )
    session.commit()

    portfolio = portfolio_service.get_portfolio_summary(session, user.user_id)

    assert len(portfolio.accounts) == 1
    assert portfolio.accounts[0].account_type == "COMMODITY"
    assert portfolio.accounts[0].holdings[0].asset_type == "GOLD"
    assert portfolio.accounts[0].total_value == Decimal("13000")


def test_custom_account_can_opt_into_holdings(session, user):
    account = account_service.create_account(
        session,
        AccountCreate(
            account_name="Art collection",
            account_type="COLLECTIBLES",
            metadata_={
                "type_label": "Art collection",
                "supports_holdings": True,
            },
        ),
        user.user_id,
    )

    holding = investment_service.buy_holding(
        session,
        InvestmentHoldingCreate(
            account_id=account.account_id,
            symbol="PAINTING_1",
            name="Painting",
            asset_type=AssetType.COLLECTIBLE.value,
            quantity=Decimal("1"),
            average_price=Decimal("1000"),
            current_price=Decimal("1200"),
            price_source=PriceSource.MANUAL.value,
        ),
        user.user_id,
    )

    assert holding.account_id == account.account_id
    assert account_service.enrich_account(session, account).net_value == Decimal("1200.000000")


def test_adding_quantity_preserves_manual_valuation_and_metadata(session, user):
    account = account_service.create_account(
        session,
        AccountCreate(account_name="Gold", account_type="COMMODITY", currency="INR"),
        user.user_id,
    )
    base_holding = InvestmentHoldingCreate(
        account_id=account.account_id,
        symbol="GOLD_24K",
        name="24K gold",
        asset_type="GOLD",
        unit="gram",
        quantity=Decimal("5"),
        average_price=Decimal("7000"),
        current_price=Decimal("7600"),
        currency="INR",
        price_source="MANUAL",
        metadata_={"purity": "999"},
    )
    holding = investment_service.buy_holding(session, base_holding, user.user_id)

    holding = investment_service.buy_holding(
        session,
        InvestmentHoldingCreate(
            account_id=account.account_id,
            symbol="GOLD_24K",
            name="24K gold",
            asset_type="GOLD",
            unit="gram",
            quantity=Decimal("2"),
            average_price=Decimal("7200"),
            currency="INR",
            price_source="MANUAL",
        ),
        user.user_id,
    )

    assert holding.quantity == Decimal("7.0000")
    assert holding.current_price == Decimal("7600.00")
    assert holding.metadata_ == {"purity": "999"}


def test_fixed_deposit_still_creates_opening_principal(session, user):
    account = account_service.create_account(
        session,
        AccountCreate(
            account_name="One year deposit",
            account_type=AccountType.FIXED_DEPOSIT.value,
            currency="INR",
            metadata_={
                "principal_amount": "50000",
                "start_date": "2026-08-01T00:00:00",
                "maturity_date": "2027-08-01T00:00:00",
            },
        ),
        user.user_id,
    )

    transactions = session.exec(
        select(Transaction).where(Transaction.account_id == account.account_id)
    ).all()
    assert len(transactions) == 1
    assert transactions[0].amount == Decimal("50000.00")
    assert account_service.calculate_account_balance(session, account) == Decimal("50000.00")
