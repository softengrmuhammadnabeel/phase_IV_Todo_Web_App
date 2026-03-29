"""
Stateless agent runner using the OpenAI Agents SDK.
Runner.run(agent, input=..., session=..., context=...) with CRUD function_tool tools.
"""
import logging
import os
from typing import Any, List

from agents import Agent, Runner
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai.agent import build_agent, get_openai_api_key
from src.ai.context import AgentContext
from src.ai.db_session import DbBackedSession
from src.services.message_service import get_conversation_messages, add_message

logger = logging.getLogger(__name__)

FALLBACK_RESPONSE = "I'm sorry, I couldn't process that right now. Please try again."


def _extract_tool_calls(result: Any) -> List[Any]:
    """Extract tool call info from RunResult.new_items for the API response."""
    tool_calls_used: List[Any] = []
    for item in getattr(result, "new_items", []) or []:
        kind = getattr(item, "type", None) or type(item).__name__
        if "ToolCall" in str(kind) or (hasattr(item, "name") and hasattr(item, "arguments")):
            name = getattr(item, "name", None)
            args = getattr(item, "arguments", None)
            if name:
                tool_calls_used.append({"name": name, "arguments": args or {}})
    return tool_calls_used


async def run(
    session: AsyncSession,
    user_id: str,
    conversation_id: int,
    user_message: str,
) -> tuple[int, str, List[Any]]:
    """
    Run the agent with the OpenAI Agents SDK. Uses DbBackedSession for history and AgentContext for tools.
    Returns (conversation_id, response_text, tool_calls_list).
    """
    api_key = get_openai_api_key()
    if not api_key:
        return (
            conversation_id,
            "Chat is not configured (missing API key). Add OPENAI_API_KEY to your .env.",
            [],
        )

    # So the SDK's client uses our key
    prev_key = os.environ.get("OPENAI_API_KEY")
    os.environ["OPENAI_API_KEY"] = api_key
    try:
        context = AgentContext(
            user_id=user_id.strip(),
            conversation_id=conversation_id,
            db_session=session,
        )
        db_session = DbBackedSession(session, user_id, conversation_id)
        agent = build_agent()

        result = await Runner.run(
            agent,
            input=user_message,
            session=db_session,
            context=context,
        )

        response_text = (getattr(result, "final_output", None) or "").strip() or FALLBACK_RESPONSE
        tool_calls_used = _extract_tool_calls(result)
        return conversation_id, response_text, tool_calls_used
    except Exception as e:
        logger.exception("Agent run failed: %s", e)
        return conversation_id, FALLBACK_RESPONSE, []
    finally:
        if prev_key is not None:
            os.environ["OPENAI_API_KEY"] = prev_key
        else:
            os.environ.pop("OPENAI_API_KEY", None)
