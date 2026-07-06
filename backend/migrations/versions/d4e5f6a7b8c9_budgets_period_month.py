"""Make budgets month-specific: add period_month, drop period

Revision ID: d4e5f6a7b8c9
Revises: a1f2e3d4c5b6
Create Date: 2026-07-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'a1f2e3d4c5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('budgets', sa.Column('period_month', sa.Date(), nullable=True))
    op.execute("UPDATE budgets SET period_month = DATE_FORMAT(NOW(), '%Y-%m-01')")
    op.alter_column('budgets', 'period_month', existing_type=sa.Date(), nullable=False)

    op.drop_constraint('uq_budget_user_category', 'budgets', type_='unique')
    op.create_unique_constraint(
        'uq_budget_user_category_month', 'budgets', ['user_id', 'category_id', 'period_month']
    )
    op.drop_column('budgets', 'period')


def downgrade() -> None:
    op.add_column('budgets', sa.Column('period', sa.String(length=20), nullable=True))
    op.execute("UPDATE budgets SET period = 'MONTHLY'")
    op.alter_column('budgets', 'period', existing_type=sa.String(length=20), nullable=False)

    op.drop_constraint('uq_budget_user_category_month', 'budgets', type_='unique')
    op.create_unique_constraint('uq_budget_user_category', 'budgets', ['user_id', 'category_id'])
    op.drop_column('budgets', 'period_month')
