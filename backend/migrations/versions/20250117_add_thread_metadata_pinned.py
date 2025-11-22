"""Add metadata and pinned to threads.

Revision ID: 007
Revises: 006
Create Date: 2025-01-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "threads",
        sa.Column("pinned", sa.Boolean(), nullable=False, server_default="false")
    )
    op.add_column(
        "threads",
        sa.Column("settings", postgresql.JSON(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("threads", "settings")
    op.drop_column("threads", "pinned")
