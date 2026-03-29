"""chat tables sync (Spec-4: conversations and messages per chat models)

Revision ID: a1b2c3d4e5f6
Revises: c4f8a1b2d3e4
Create Date: 2026-02-08

Creates conversations and messages tables to match src.models.conversation.Conversation
and src.models.message.Message. Idempotent: creates only if tables do not exist.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "c4f8a1b2d3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    tables = insp.get_table_names()

    if "conversations" not in tables:
        op.create_table(
            "conversations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_conversations_user_id"),
            "conversations",
            ["user_id"],
            unique=False,
        )

    if "messages" not in tables:
        op.create_table(
            "messages",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("conversation_id", sa.Integer(), nullable=False),
            sa.Column("role", sa.String(length=20), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(
                ["conversation_id"],
                ["conversations.id"],
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            op.f("ix_messages_user_id"),
            "messages",
            ["user_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_messages_conversation_id"),
            "messages",
            ["conversation_id"],
            unique=False,
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_messages_conversation_id"), table_name="messages")
    op.drop_index(op.f("ix_messages_user_id"), table_name="messages")
    op.drop_table("messages")
    op.drop_index(op.f("ix_conversations_user_id"), table_name="conversations")
    op.drop_table("conversations")
