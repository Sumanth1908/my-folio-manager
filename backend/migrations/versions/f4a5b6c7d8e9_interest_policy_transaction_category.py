"""Add an optional category for managed interest transactions.

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-08-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f4a5b6c7d8e9"
down_revision: Union[str, Sequence[str], None] = "e3f4a5b6c7d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("interest_policies") as batch_op:
        batch_op.add_column(sa.Column("category_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_interest_policies_category_id_category",
            "category",
            ["category_id"],
            ["category_id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("interest_policies") as batch_op:
        batch_op.drop_constraint(
            "fk_interest_policies_category_id_category",
            type_="foreignkey",
        )
        batch_op.drop_column("category_id")
