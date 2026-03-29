from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List
from src.models.message import Message


async def add_message(
    session: AsyncSession,
    user_id: str,
    conversation_id: int,
    role: str,
    content: str,
) -> Message:
    msg = Message(
        user_id=user_id,
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg


async def get_conversation_messages(
    session: AsyncSession,
    conversation_id: int,
    user_id: str,
) -> List[Message]:
    stmt = (
        select(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.user_id == user_id,
        )
        .order_by(Message.created_at.asc()) # type: ignore
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())
