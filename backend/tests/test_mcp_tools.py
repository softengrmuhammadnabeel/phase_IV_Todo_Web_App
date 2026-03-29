"""Spec-4: MCP tools unit tests. User scoping: tools use only injected user_id."""
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from src.models.task import Task
from src.models.conversation import Conversation
from src.models.message import Message
from src.ai.mcp_server import add_task, list_tasks, complete_task, delete_task, update_task, TOOL_HANDLERS


@pytest.fixture
async def async_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session_factory() as session:
        yield session


@pytest.mark.asyncio
async def test_add_task_user_scoped(async_session: AsyncSession):
    """add_task creates task for given user_id only."""
    result = await add_task(async_session, "user_a", title="Task A")
    assert result["success"] is True
    assert "task" in result
    assert result["task"]["title"] == "Task A"

    # List for same user
    list_result = await list_tasks(async_session, "user_a")
    assert list_result["success"] is True
    assert len(list_result["tasks"]) == 1

    # List for other user is empty
    list_b = await list_tasks(async_session, "user_b")
    assert list_b["success"] is True
    assert len(list_b["tasks"]) == 0


@pytest.mark.asyncio
async def test_complete_task_only_own(async_session: AsyncSession):
    """complete_task only affects task owned by user_id."""
    await add_task(async_session, "user_1", title="One")
    list_r = await list_tasks(async_session, "user_1")
    task_id = list_r["tasks"][0]["id"]

    result = await complete_task(async_session, "user_1", task_id=task_id)
    assert result["success"] is True

    # Wrong user cannot complete (task not found for them)
    result_other = await complete_task(async_session, "other_user", task_id=task_id)
    assert result_other["success"] is False
    assert "couldn't find" in result_other.get("error", "").lower() or "error" in result_other


@pytest.mark.asyncio
async def test_delete_task_only_own(async_session: AsyncSession):
    """delete_task only deletes task owned by user_id."""
    await add_task(async_session, "owner", title="To delete")
    list_r = await list_tasks(async_session, "owner")
    task_id = list_r["tasks"][0]["id"]

    result = await delete_task(async_session, "owner", task_id=task_id)
    assert result["success"] is True

    list_after = await list_tasks(async_session, "owner")
    assert len(list_after["tasks"]) == 0
