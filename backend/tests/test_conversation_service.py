"""Spec-4: Conversation and Message service tests. User scoping and message order."""
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from src.models.conversation import Conversation
from src.models.message import Message
from src.services.conversation_service import create_conversation, get_conversation, list_user_conversations
from src.services.message_service import add_message, get_conversation_messages


@pytest.fixture
async def async_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest.mark.asyncio
async def test_create_and_get_conversation_user_scoped(async_session: AsyncSession):
    conv = await create_conversation(async_session, "user_1")
    assert conv.id is not None
    assert conv.user_id == "user_1"

    got = await get_conversation(async_session, conv.id, "user_1")
    assert got is not None
    assert got.id == conv.id

    other = await get_conversation(async_session, conv.id, "other_user")
    assert other is None


@pytest.mark.asyncio
async def test_messages_in_order(async_session: AsyncSession):
    conv = await create_conversation(async_session, "u")
    await add_message(async_session, "u", conv.id, "user", "First")
    await add_message(async_session, "u", conv.id, "assistant", "Second")
    await add_message(async_session, "u", conv.id, "user", "Third")

    msgs = await get_conversation_messages(async_session, conv.id, "u")
    assert len(msgs) == 3
    assert [m.content for m in msgs] == ["First", "Second", "Third"]
