"""add_is_featured_to_recipe

Revision ID: a1b2c3d4e5f6
Revises: 4c01bbe5cc6f
Create Date: 2026-03-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '4c01bbe5cc6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('recipes', sa.Column('is_featured', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.create_index('ix_recipes_is_featured', 'recipes', ['is_featured'])


def downgrade() -> None:
    op.drop_index('ix_recipes_is_featured', table_name='recipes')
    op.drop_column('recipes', 'is_featured')
