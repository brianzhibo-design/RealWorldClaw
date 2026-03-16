"""initial schema

Revision ID: 029c5cab85f0
Revises: 20260225_171500
Create Date: 2026-03-16 13:06:09.781291

Note:
    项目迁移到 PostgreSQL 时启用（currently placeholder migration).

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = '029c5cab85f0'
down_revision: Union[str, Sequence[str], None] = '20260225_171500'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
