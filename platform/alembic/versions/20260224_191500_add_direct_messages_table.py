"""add direct_messages table

Revision ID: 20260224_191500
Revises: 
Create Date: 2026-02-24 19:15:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260224_191500"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "direct_messages",
        sa.Column("id", sa.Text(), primary_key=True, nullable=False),
        sa.Column("sender_id", sa.Text(), nullable=False),
        sa.Column("recipient_id", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.Text(), nullable=False),
    )
    op.create_index("idx_dm_sender_recipient", "direct_messages", ["sender_id", "recipient_id"])
    op.create_index("idx_dm_created_at", "direct_messages", ["created_at"])


def downgrade() -> None:
    op.drop_index("idx_dm_created_at", table_name="direct_messages")
    op.drop_index("idx_dm_sender_recipient", table_name="direct_messages")
    op.drop_table("direct_messages")
