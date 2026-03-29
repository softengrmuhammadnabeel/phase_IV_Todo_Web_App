from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Optional
from src.models.conversation import Conversation
from src.models.message import Message


async def create_conversation(session: AsyncSession, user_id: str) -> Conversation:
    conv = Conversation(user_id=user_id)
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return conv


async def get_conversation(
    session: AsyncSession, conversation_id: int, user_id: str
) -> Optional[Conversation]:
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id,
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_user_conversations(session: AsyncSession, user_id: str) -> List[Conversation]:
    stmt = select(Conversation).where(Conversation.user_id == user_id).order_by(Conversation.updated_at.desc()) # type: ignore
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def delete_conversation(
    session: AsyncSession, conversation_id: int, user_id: str
) -> bool:
    """Delete a conversation and its messages. Returns True if deleted, False if not found or not owned."""
    conv = await get_conversation(session, conversation_id, user_id)
    if not conv:
        return False
    await session.execute(delete(Message).where(Message.conversation_id == conversation_id)) # type: ignore
    await session.delete(conv)
    await session.flush()
    return True
