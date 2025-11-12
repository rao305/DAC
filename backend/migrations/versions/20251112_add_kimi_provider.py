"""Add kimi to provider_type enum.

Revision ID: 005
Revises: 004
Create Date: 2025-11-12
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add kimi to provider_type enum."""
    op.execute(
        """
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum
                WHERE enumtypid = 'provider_type'::regtype
                AND enumlabel = 'kimi'
            ) THEN
                ALTER TYPE provider_type ADD VALUE 'kimi';
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    """No-op downgrade (cannot remove enum values in PostgreSQL)."""
    pass

