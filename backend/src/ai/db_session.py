"""
DB-backed Session for the OpenAI Agents SDK.
Stores conversation history in our messages table; get_items/add_items for Runner.run(session=...).
Implements the SDK Session protocol (session_id, session_settings, get_items, add_items, pop_item, clear_session).
"""
from typing import Any, List

from sqlalchemy.ext.asyncio import AsyncSession

from src.services.message_service import get_conversation_messages, add_message


def _item_role(item: Any) -> str | None:
    """Extract role from SDK item (dict or object)."""
    if hasattr(item, "role"):
        return getattr(item, "role", None)
    if isinstance(item, dict):
        return item.get("role")
    return None


def _content_to_str(raw: Any) -> str:
    """Normalize content to a string. SDK may send list of parts (e.g. [{'type': 'output_text', 'text': '...'}])."""
    if raw is None:
        return ""
    if isinstance(raw, str):
        return raw
    if isinstance(raw, list):
        parts = []
        for part in raw:
            if isinstance(part, dict):
                text = part.get("text")
                if text is not None:
                    parts.append(str(text))
            elif hasattr(part, "text"):
                parts.append(str(getattr(part, "text", "")))
        return "\n".join(parts) if parts else ""
    return str(raw)


def _item_content(item: Any) -> str:
    """Extract content from SDK item; normalize to string (handles list/content parts from OpenAI Responses)."""
    raw = None
    if hasattr(item, "content"):
        raw = getattr(item, "content", None)
    elif isinstance(item, dict):
        raw = item.get("content")
    return _content_to_str(raw)


class DbBackedSession:
    """
    Session implementation that reads/writes messages to our DB.
    Conforms to the SDK Session protocol (session_id, session_settings, get_items, add_items, pop_item, clear_session).
    """

    def __init__(
        self,
        db_session: AsyncSession,
        user_id: str,
        conversation_id: int,
    ):
        self._db = db_session
        self._user_id = user_id.strip()
        self._conversation_id = conversation_id
        # Session protocol (agents.memory.session.Session)
        self.session_id: str = f"{self._user_id}:{conversation_id}"
        self.session_settings: Any = None

    async def get_items(self, limit: int | None = None) -> List[Any]:
        """Return conversation history as items the SDK expects (role + content)."""
        messages = await get_conversation_messages(
            self._db, self._conversation_id, self._user_id
        )
        items = [{"role": m.role, "content": m.content or ""} for m in messages]
        if limit is not None:
            items = items[-limit:] if len(items) > limit else items
        return items

    async def add_items(self, items: List[Any]) -> None:
        """Persist new items (user/assistant messages) to the messages table."""
        for item in items:
            role = _item_role(item)
            content = _item_content(item)
            if role in ("user", "assistant") and content is not None:
                await add_message(
                    self._db,
                    self._user_id,
                    self._conversation_id,
                    role,
                    content,
                )

    async def pop_item(self) -> Any | None:
        """Remove and return the most recent item. We do not support removal; return None."""
        return None

    async def clear_session(self) -> None:
        """Clear all items. We do not implement deletion of messages."""
        pass
