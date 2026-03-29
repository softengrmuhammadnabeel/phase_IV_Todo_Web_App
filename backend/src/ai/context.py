"""
Run context for the OpenAI Agents SDK: DB session and user/conversation ids.
Passed to Runner.run(context=...) and available in tools via RunContextWrapper.
"""
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class AgentContext:
    """Context injected into agent runs; not sent to the LLM."""

    user_id: str
    conversation_id: int
    db_session: Any  # AsyncSession; Any to avoid serialization
