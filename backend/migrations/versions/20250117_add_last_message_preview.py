"""Add last_message_preview to threads.

Revision ID: 006
Revises: 005
Create Date: 2025-01-17
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "threads",
        sa.Column("last_message_preview", sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("threads", "last_message_preview")
