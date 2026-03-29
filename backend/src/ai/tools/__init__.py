"""
Agent CRUD tools for the chatbot.
Exposes task Create, Read, Update, Delete as OpenAI-compatible tools for the agent.
"""
from src.ai.tools.crud import (
    TOOL_DEFINITIONS,
    TOOL_HANDLERS,
)

__all__ = ["TOOL_DEFINITIONS", "TOOL_HANDLERS"]
