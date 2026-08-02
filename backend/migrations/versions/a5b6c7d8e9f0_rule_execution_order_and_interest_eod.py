"""Add deterministic rule order and schedule managed interest at end of day.

Revision ID: a5b6c7d8e9f0
Revises: f4a5b6c7d8e9
Create Date: 2026-08-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a5b6c7d8e9f0"
down_revision: Union[str, Sequence[str], None] = "f4a5b6c7d8e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _set_interest_time(hour: int, minute: int) -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    value = f"{hour:02d}:{minute:02d}:00"
    if dialect == "mysql":
        op.execute(sa.text(
            "UPDATE rules "
            "SET next_run_at = TIMESTAMP(DATE(next_run_at), :settlement_time) "
            "WHERE rule_type = 'INTEREST' AND next_run_at IS NOT NULL"
        ).bindparams(settlement_time=value))
    elif dialect == "postgresql":
        op.execute(sa.text(
            "UPDATE rules "
            "SET next_run_at = DATE_TRUNC('day', next_run_at) + CAST(:settlement_time AS time) "
            "WHERE rule_type = 'INTEREST' AND next_run_at IS NOT NULL"
        ).bindparams(settlement_time=value))
    else:
        op.execute(sa.text(
            "UPDATE rules "
            "SET next_run_at = datetime(date(next_run_at), :hours, :minutes) "
            "WHERE rule_type = 'INTEREST' AND next_run_at IS NOT NULL"
        ).bindparams(hours=f"+{hour} hours", minutes=f"+{minute} minutes"))


def upgrade() -> None:
    with op.batch_alter_table("rules") as batch_op:
        batch_op.add_column(
            sa.Column("execution_order", sa.Integer(), server_default="100", nullable=False)
        )
        batch_op.create_index("ix_rules_execution_order", ["execution_order"], unique=False)

    op.execute(sa.text(
        "UPDATE rules SET execution_order = 900 WHERE rule_type = 'INTEREST'"
    ))
    _set_interest_time(23, 55)


def downgrade() -> None:
    _set_interest_time(0, 0)
    with op.batch_alter_table("rules") as batch_op:
        batch_op.drop_index("ix_rules_execution_order")
        batch_op.drop_column("execution_order")
