"""Make accounts and holdings extensible for diverse assets.

Revision ID: c2d3e4f5a6b7
Revises: d4e5f6a7b8c9
Create Date: 2026-08-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c2d3e4f5a6b7"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # VARCHAR avoids a schema migration every time an account or custom asset
    # category is introduced.
    op.alter_column(
        "accounts",
        "account_type",
        existing_type=sa.Enum(
            "SAVINGS",
            "INVESTMENT",
            "LOAN",
            "FIXED_DEPOSIT",
            "RECURRING_DEPOSIT",
            name="accounttype",
        ),
        type_=sa.String(length=40),
        existing_nullable=False,
    )
    op.add_column(
        "investment_holdings",
        sa.Column("asset_type", sa.String(length=40), nullable=False, server_default="EQUITY"),
    )
    op.add_column(
        "investment_holdings",
        sa.Column("unit", sa.String(length=20), nullable=False, server_default="unit"),
    )
    op.add_column(
        "investment_holdings",
        sa.Column("price_source", sa.String(length=20), nullable=False, server_default="MARKET"),
    )
    op.add_column("investment_holdings", sa.Column("metadata_", sa.JSON(), nullable=True))
    op.create_index(
        op.f("ix_investment_holdings_asset_type"),
        "investment_holdings",
        ["asset_type"],
        unique=False,
    )


def downgrade() -> None:
    # Rows using new types cannot be represented by the old enum. Refuse a
    # lossy downgrade until callers have explicitly migrated those rows.
    connection = op.get_bind()
    new_type_count = connection.execute(
        sa.text(
            "SELECT COUNT(*) FROM accounts "
            "WHERE account_type NOT IN "
            "('SAVINGS','INVESTMENT','LOAN','FIXED_DEPOSIT','RECURRING_DEPOSIT')"
        )
    ).scalar_one()
    if new_type_count:
        raise RuntimeError("Cannot downgrade while accounts use extensible account types")

    op.drop_index(op.f("ix_investment_holdings_asset_type"), table_name="investment_holdings")
    op.drop_column("investment_holdings", "metadata_")
    op.drop_column("investment_holdings", "price_source")
    op.drop_column("investment_holdings", "unit")
    op.drop_column("investment_holdings", "asset_type")
    op.alter_column(
        "accounts",
        "account_type",
        existing_type=sa.String(length=40),
        type_=sa.Enum(
            "SAVINGS",
            "INVESTMENT",
            "LOAN",
            "FIXED_DEPOSIT",
            "RECURRING_DEPOSIT",
            name="accounttype",
        ),
        existing_nullable=False,
    )
