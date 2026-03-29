"""
Re-exports CRUD tools for backward compatibility.
Agent CRUD tools live in src.ai.tools.crud; this module delegates to them.
"""
from src.ai.tools.crud import (
    TOOL_DEFINITIONS,
    TOOL_HANDLERS,
    add_task,
    list_tasks,
    complete_task,
    delete_task,
    update_task,
)

__all__ = [
    "TOOL_DEFINITIONS",
    "TOOL_HANDLERS",
    "add_task",
    "list_tasks",
    "complete_task",
    "delete_task",
    "update_task",
]
