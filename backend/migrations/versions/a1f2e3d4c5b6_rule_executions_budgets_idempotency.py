"""Add rule_executions and budgets tables, transaction idempotency key and account/date index

Revision ID: a1f2e3d4c5b6
Revises: bc8a33302897
Create Date: 2026-07-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f2e3d4c5b6'
down_revision: Union[str, Sequence[str], None] = 'bc8a33302897'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'rule_executions',
        sa.Column('execution_id', sa.Integer(), nullable=False),
        sa.Column('rule_id', sa.Integer(), sa.ForeignKey('rules.rule_id', ondelete='CASCADE'), nullable=False),
        sa.Column('ran_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('transaction_id', sa.Integer(), nullable=True),
        sa.Column('transfer_id', sa.String(length=36), nullable=True),
        sa.Column('period_start', sa.DateTime(), nullable=True),
        sa.Column('period_end', sa.DateTime(), nullable=True),
        sa.Column('error', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('execution_id'),
    )
    op.create_index('ix_rule_executions_rule_id', 'rule_executions', ['rule_id'])

    op.create_table(
        'budgets',
        sa.Column('budget_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('category_id', sa.Integer(), sa.ForeignKey('category.category_id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('period', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('budget_id'),
        sa.UniqueConstraint('user_id', 'category_id', name='uq_budget_user_category'),
    )
    op.create_index('ix_budgets_user_id', 'budgets', ['user_id'])

    op.add_column('transactions', sa.Column('idempotency_key', sa.String(length=64), nullable=True))
    op.create_unique_constraint('uq_transactions_idempotency_key', 'transactions', ['idempotency_key'])
    op.create_index('ix_transactions_account_date', 'transactions', ['account_id', 'transaction_date'])


def downgrade() -> None:
    op.drop_index('ix_transactions_account_date', table_name='transactions')
    op.drop_constraint('uq_transactions_idempotency_key', 'transactions', type_='unique')
    op.drop_column('transactions', 'idempotency_key')
    op.drop_index('ix_budgets_user_id', table_name='budgets')
    op.drop_table('budgets')
    op.drop_index('ix_rule_executions_rule_id', table_name='rule_executions')
    op.drop_table('rule_executions')
