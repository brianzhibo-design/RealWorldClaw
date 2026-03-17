"""add gdpr fields to users

Revision ID: 20260317_174900
Revises: 029c5cab85f0
Create Date: 2026-03-17 17:49:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260317_174900"
down_revision = "029c5cab85f0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("consent", sa.Text(), nullable=False, server_default="{}"))
    op.add_column("users", sa.Column("deleted_at", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("anonymized", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("users", "anonymized")
    op.drop_column("users", "deleted_at")
    op.drop_column("users", "consent")
