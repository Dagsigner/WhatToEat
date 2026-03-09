"""add_featured_sync_tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-09 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add featured_at column to recipes
    op.add_column('recipes', sa.Column('featured_at', sa.DateTime(timezone=True), nullable=True))

    # 2. Create user_dismissed_featured table
    op.create_table(
        'user_dismissed_featured',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recipe_id', UUID(as_uuid=True), sa.ForeignKey('recipes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'recipe_id', name='uq_user_recipe_dismissed'),
    )
    op.create_index('ix_dismissed_featured_user', 'user_dismissed_featured', ['user_id'])
    op.create_index('ix_dismissed_featured_recipe', 'user_dismissed_featured', ['recipe_id'])

    # 3. Create featured_sync_config table
    op.create_table(
        'featured_sync_config',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('last_sync_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    # Insert initial row
    op.execute("INSERT INTO featured_sync_config (id, last_sync_at) VALUES (1, now())")

    # 4. Backfill featured_at for already-featured recipes
    op.execute("UPDATE recipes SET featured_at = updated_at WHERE is_featured = true")


def downgrade() -> None:
    op.drop_table('featured_sync_config')
    op.drop_index('ix_dismissed_featured_recipe', table_name='user_dismissed_featured')
    op.drop_index('ix_dismissed_featured_user', table_name='user_dismissed_featured')
    op.drop_table('user_dismissed_featured')
    op.drop_column('recipes', 'featured_at')
