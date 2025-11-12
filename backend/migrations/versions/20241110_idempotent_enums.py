"""Create shared ENUM types idempotently.

Revision ID: 003
Revises: 002
Create Date: 2024-11-10
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


ENUM_DEFINITIONS = {
    "user_role": ("admin", "member", "viewer"),
    "message_role": ("user", "assistant", "system"),
    "memory_tier": ("private", "shared"),
    "provider_type": ("perplexity", "openai", "gemini", "openrouter"),
}


def upgrade() -> None:
    """Create ENUM types if they do not already exist."""
    for enum_name, values in ENUM_DEFINITIONS.items():
        values_sql = ", ".join(f"'{value}'" for value in values)
        op.execute(
            f"""
            DO $$ BEGIN
                CREATE TYPE {enum_name} AS ENUM ({values_sql});
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
            """
        )


def downgrade() -> None:
    """No-op downgrade to avoid dropping shared ENUMs."""
    pass
