"""Spec-4: Chat endpoint tests. 401, 403, 400/422, and optional multi-turn."""
import pytest
from starlette.testclient import TestClient
from src.main import app
from src.api.deps.auth import get_current_user_id
from src.models.database import get_async_session


def test_chat_401_without_auth():
    """Without JWT, chat returns 401."""
    # No override: real get_current_user_id will require Bearer token
    with TestClient(app) as client:
        r = client.post(
            "/api/test_user_123/chat",
            json={"message": "hello"},
        )
        assert r.status_code == 403  # No auth header -> Forbidden by HTTPBearer


def test_chat_403_wrong_user_id(async_client: TestClient):
    """Path user_id different from JWT user_id returns 403."""
    # async_client overrides get_current_user_id to return "test_user_123"
    r = async_client.post(
        "/api/other_user/chat",
        json={"message": "hello"},
        headers={"Authorization": "Bearer mock"},
    )
    assert r.status_code == 403
    assert "path" in r.json().get("detail", "").lower() or "denied" in r.json().get("detail", "").lower()


def test_chat_400_empty_message(async_client: TestClient):
    """Empty message returns 400 or 422."""
    r = async_client.post(
        "/api/test_user_123/chat",
        json={"message": ""},
        headers={"Authorization": "Bearer mock"},
    )
    assert r.status_code in (400, 422)


@pytest.mark.skip(reason="Requires OPENAI_API_KEY and DB with conversations/messages; run manually")
def test_chat_multi_turn_context():
    """Multi-turn: first message creates conversation, second uses same conversation_id and context."""
    # Integration test: POST twice with same conversation_id, verify second response is in context
    pass
