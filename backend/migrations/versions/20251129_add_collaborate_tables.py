"""Add collaboration tables for persistence and analytics.

Revision ID: 009
Revises: 008
Create Date: 2025-11-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create collaborate_runs table
    op.create_table(
        "collaborate_runs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("thread_id", sa.String(), nullable=False),
        sa.Column("user_message_id", sa.String(), nullable=False),
        sa.Column("assistant_message_id", sa.String(), nullable=True),
        sa.Column("mode", sa.String(16), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="running"),
        sa.Column("error_reason", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["thread_id"], ["threads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_message_id"], ["messages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assistant_message_id"], ["messages.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    
    # Create collaborate_stages table
    op.create_table(
        "collaborate_stages",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("run_id", sa.String(), nullable=False),
        sa.Column("stage_id", sa.String(32), nullable=False),
        sa.Column("label", sa.String(128), nullable=False),
        sa.Column("provider", sa.String(64), nullable=True),
        sa.Column("model", sa.String(128), nullable=True),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("meta", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["run_id"], ["collaborate_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    
    # Create collaborate_reviews table
    op.create_table(
        "collaborate_reviews",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("run_id", sa.String(), nullable=False),
        sa.Column("source", sa.String(32), nullable=False),
        sa.Column("provider", sa.String(64), nullable=True),
        sa.Column("model", sa.String(128), nullable=True),
        sa.Column("stance", sa.String(16), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=True),
        sa.Column("completion_tokens", sa.Integer(), nullable=True),
        sa.Column("total_tokens", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["collaborate_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    
    # Add indexes for better query performance
    op.create_index(op.f("ix_collaborate_runs_thread_id"), "collaborate_runs", ["thread_id"], unique=False)
    op.create_index(op.f("ix_collaborate_runs_status"), "collaborate_runs", ["status"], unique=False)
    op.create_index(op.f("ix_collaborate_runs_mode"), "collaborate_runs", ["mode"], unique=False)
    op.create_index(op.f("ix_collaborate_stages_run_id"), "collaborate_stages", ["run_id"], unique=False)
    op.create_index(op.f("ix_collaborate_stages_status"), "collaborate_stages", ["status"], unique=False)
    op.create_index(op.f("ix_collaborate_reviews_run_id"), "collaborate_reviews", ["run_id"], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f("ix_collaborate_reviews_run_id"), table_name="collaborate_reviews")
    op.drop_index(op.f("ix_collaborate_stages_status"), table_name="collaborate_stages")
    op.drop_index(op.f("ix_collaborate_stages_run_id"), table_name="collaborate_stages")
    op.drop_index(op.f("ix_collaborate_runs_mode"), table_name="collaborate_runs")
    op.drop_index(op.f("ix_collaborate_runs_status"), table_name="collaborate_runs")
    op.drop_index(op.f("ix_collaborate_runs_thread_id"), table_name="collaborate_runs")
    
    # Drop tables
    op.drop_table("collaborate_reviews")
    op.drop_table("collaborate_stages")
    op.drop_table("collaborate_runs")