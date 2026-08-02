"""Add managed interest policies and execution audit.

Revision ID: e3f4a5b6c7d8
Revises: c2d3e4f5a6b7
Create Date: 2026-08-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e3f4a5b6c7d8"
down_revision: Union[str, Sequence[str], None] = "c2d3e4f5a6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Managed interest is a first-class rule type. VARCHAR also keeps future
    # automation strategies from requiring another database enum migration.
    op.alter_column(
        "rules",
        "rule_type",
        existing_type=sa.Enum(
            "CATEGORIZATION",
            "TRANSACTION",
            "CALCULATION",
            name="ruletype",
        ),
        type_=sa.String(length=30),
        existing_nullable=False,
    )

    op.add_column(
        "transactions",
        sa.Column("transaction_kind", sa.String(length=30), nullable=False, server_default="USER"),
    )
    op.create_index(
        op.f("ix_transactions_transaction_kind"),
        "transactions",
        ["transaction_kind"],
        unique=False,
    )

    op.create_table(
        "interest_policies",
        sa.Column("policy_id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.String(length=36), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("direction", sa.String(length=20), nullable=False),
        sa.Column("annual_rate", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("balance_basis", sa.String(length=30), nullable=False),
        sa.Column("day_count", sa.String(length=20), nullable=False),
        sa.Column("treatment", sa.String(length=20), nullable=False),
        sa.Column("settlement_frequency", sa.String(length=20), nullable=False),
        sa.Column("payout_account_id", sa.String(length=36), nullable=True),
        sa.Column("effective_from", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=True),
        sa.Column("calculation_version", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.account_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payout_account_id"], ["accounts.account_id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("policy_id"),
    )
    op.create_index(op.f("ix_interest_policies_account_id"), "interest_policies", ["account_id"], unique=True)

    op.create_table(
        "interest_rate_periods",
        sa.Column("rate_period_id", sa.Integer(), nullable=False),
        sa.Column("policy_id", sa.Integer(), nullable=False),
        sa.Column("annual_rate", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("effective_from", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["policy_id"], ["interest_policies.policy_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("rate_period_id"),
        sa.UniqueConstraint("policy_id", "effective_from", name="uq_interest_rate_effective_from"),
    )
    op.create_index(op.f("ix_interest_rate_periods_policy_id"), "interest_rate_periods", ["policy_id"], unique=False)

    op.create_table(
        "interest_executions",
        sa.Column("execution_id", sa.Integer(), nullable=False),
        sa.Column("policy_id", sa.Integer(), nullable=False),
        sa.Column("rule_id", sa.Integer(), nullable=True),
        sa.Column("period_start", sa.DateTime(), nullable=False),
        sa.Column("period_end", sa.DateTime(), nullable=False),
        sa.Column("eligible_balance", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("annual_rate", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("days", sa.Integer(), nullable=False),
        sa.Column("accrued_amount", sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column("treatment", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("transaction_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["policy_id"], ["interest_policies.policy_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["rule_id"], ["rules.rule_id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("execution_id"),
        sa.UniqueConstraint(
            "policy_id",
            "period_start",
            "period_end",
            name="uq_interest_execution_period",
        ),
    )
    op.create_index(op.f("ix_interest_executions_policy_id"), "interest_executions", ["policy_id"], unique=False)


def downgrade() -> None:
    managed_count = op.get_bind().execute(
        sa.text("SELECT COUNT(*) FROM rules WHERE rule_type = 'INTEREST'")
    ).scalar_one()
    if managed_count:
        raise RuntimeError("Cannot downgrade while managed INTEREST rules exist")

    op.drop_index(op.f("ix_interest_executions_policy_id"), table_name="interest_executions")
    op.drop_table("interest_executions")
    op.drop_index(op.f("ix_interest_rate_periods_policy_id"), table_name="interest_rate_periods")
    op.drop_table("interest_rate_periods")
    op.drop_index(op.f("ix_interest_policies_account_id"), table_name="interest_policies")
    op.drop_table("interest_policies")
    op.drop_index(op.f("ix_transactions_transaction_kind"), table_name="transactions")
    op.drop_column("transactions", "transaction_kind")
    op.alter_column(
        "rules",
        "rule_type",
        existing_type=sa.String(length=30),
        type_=sa.Enum(
            "CATEGORIZATION",
            "TRANSACTION",
            "CALCULATION",
            name="ruletype",
        ),
        existing_nullable=False,
    )
