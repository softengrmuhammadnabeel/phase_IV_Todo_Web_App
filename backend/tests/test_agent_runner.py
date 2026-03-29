"""Agent runner tests (OpenAI Agents SDK)."""
import pytest
from src.ai.runner import _extract_tool_calls, run


def test_extract_tool_calls():
    """Extract tool call info from RunResult-like new_items."""
    class MockItem:
        def __init__(self, name: str, arguments: dict | None = None):
            self.name = name
            self.arguments = arguments or {}

    class MockResult:
        new_items = [
            MockItem("list_tasks", {}),
            MockItem("delete_task", {"task_id": 28}),
        ]

    out = _extract_tool_calls(MockResult())
    assert len(out) == 2
    assert out[0]["name"] == "list_tasks"
    assert out[1]["name"] == "delete_task" and out[1]["arguments"] == {"task_id": 28}


def test_extract_tool_calls_empty():
    """When new_items missing or empty, return empty list."""
    class MockResult:
        pass
    assert _extract_tool_calls(MockResult()) == []
    assert _extract_tool_calls(type("R", (), {"new_items": []})()) == []


@pytest.mark.asyncio
@pytest.mark.skip(reason="Requires OPENAI_API_KEY and DB; run manually")
async def test_run_stateless_no_memory():
    """Run twice with same context; no in-memory state between runs."""
    pass
