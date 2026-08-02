"""Apply monthly reducing-balance defaults to existing car loans.

Revision ID: b6c7d8e9f0a1
Revises: a5b6c7d8e9f0
Create Date: 2026-08-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b6c7d8e9f0a1"
down_revision: Union[str, Sequence[str], None] = "a5b6c7d8e9f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _move_existing_emi_rules_to_end_of_day() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    if dialect == "mysql":
        timestamp_expression = "TIMESTAMP(DATE(next_run_at), '23:55:00')"
    elif dialect == "postgresql":
        timestamp_expression = "DATE_TRUNC('day', next_run_at) + CAST('23:55:00' AS time)"
    else:
        timestamp_expression = "datetime(date(next_run_at), '+23 hours', '+55 minutes')"

    op.execute(sa.text(
        "UPDATE rules "
        f"SET execution_order = 950, next_run_at = {timestamp_expression} "
        "WHERE rule_type = 'TRANSACTION' "
        "AND name LIKE 'Auto Debit - %' "
        "AND account_id IN (SELECT account_id FROM accounts WHERE account_type = 'LOAN')"
    ))


def upgrade() -> None:
    op.execute(sa.text(
        "UPDATE accounts SET is_interest_enabled = 1 WHERE account_type = 'LOAN'"
    ))
    op.execute(sa.text(
        "UPDATE interest_policies SET "
        "enabled = 1, direction = 'CHARGED', "
        "balance_basis = 'PRINCIPAL_OUTSTANDING', day_count = 'THIRTY_360', "
        "treatment = 'INTEREST_DUE', settlement_frequency = 'MONTHLY', "
        "payout_account_id = NULL, calculation_version = calculation_version + 1 "
        "WHERE account_id IN (SELECT account_id FROM accounts WHERE account_type = 'LOAN')"
    ))
    _move_existing_emi_rules_to_end_of_day()


def downgrade() -> None:
    # Previous policy conventions are not recoverable because they differed by
    # account. Schema downgrade remains safe; this data normalization is kept.
    pass
