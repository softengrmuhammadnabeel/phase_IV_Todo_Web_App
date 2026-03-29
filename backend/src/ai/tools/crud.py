"""
CRUD tools for the OpenAI agent: Create, Read, Update, Delete tasks.
Used by the agent runner (OpenAI Chat Completions with tools).
All tools receive backend-injected session and user_id; they call task_service.
"""
from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession

from src.services import task_service
from src.models.task import TaskCreate


# OpenAI-compatible tool definitions for chat.completions.create(tools=...)
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task. Use when user says 'create a task named X', 'add task X', 'create a task about X', or 'create a task on X'. For 'about X' or 'on X', use title=X and set description to a short auto-generated sentence (e.g. 'Work on X' or 'Task related to X'). If no description is provided, one will be auto-generated from the title.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "The task name/title (e.g. 'Authentication flow' or 'XYZ')"},
                    "description": {"type": "string", "description": "Optional. For 'task about X' or 'task on X', generate a short description (e.g. 'Work on X'). Omit if user only gave a name."},
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "List the user's tasks. Always show each task with its ID so users can say 'delete task 5'. Optional status: 'all', 'pending', 'completed'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["all", "pending", "completed"], "description": "Filter by status"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Mark a task as completed. When user says 'complete task 123' or 'mark task id 123 done', use task_id=123. When user refers by name (e.g. 'complete Buy groceries'), use match_by_title.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "ID of the task (use when user says 'complete task 123' or 'task id 123')"},
                    "match_by_title": {"type": "string", "description": "Task title (use when user refers by name only)"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Delete a task. When user says 'delete the task of id 123', 'delete task 123', or 'remove task id 123', use task_id=123 (integer). When user refers to task by name (e.g. 'remove Bike Lover'), use match_by_title. Only the task with that exact ID is deleted.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "ID of the task to delete (use when user says 'delete task 123' or 'task of id 123')"},
                    "match_by_title": {"type": "string", "description": "Task title to find (use only when user refers to task by name, not by number)"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update a task's title or description. When user says 'update task 123 to ...' or 'rename task id 123', use task_id=123. When user refers by name ('update Bike Lover to ...'), use match_by_title. Set title and/or description to the new values.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "integer", "description": "ID of the task (use when user says 'update task 123' or 'task id 123')"},
                    "match_by_title": {"type": "string", "description": "Current task title (use when user refers by name only)"},
                    "title": {"type": "string", "description": "New title for the task"},
                    "description": {"type": "string", "description": "New description for the task"},
                },
            },
        },
    },
]


def _auto_description(title: str) -> str:
    """Generate a short description when user only provides a title."""
    t = (title or "").strip()
    if not t:
        return "Task created."
    return f"Task: {t}."


def _normalize_user_id(user_id: str) -> str:
    return str(user_id).strip() if user_id else ""


def _ensure_task_id_int(task_id: Any) -> int | None:
    """Coerce task_id from LLM to int. Return None if invalid."""
    if task_id is None:
        return None
    if isinstance(task_id, int):
        return task_id if task_id > 0 else None
    if isinstance(task_id, float):
        if task_id != int(task_id) or task_id < 1:
            return None
        return int(task_id)
    try:
        s = str(task_id).strip()
        if not s or not s.isdigit():
            return None
        tid = int(s)
        return tid if tid > 0 else None
    except (ValueError, TypeError):
        return None


def _looks_like_id(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, int):
        return value > 0
    s = str(value).strip()
    return bool(s and s.isdigit() and int(s) > 0)


async def _resolve_task_id(
    session: AsyncSession, user_id: str, task_id: Any, match_by_title: Any
) -> int | None:
    """Resolve to a task id from task_id (number) or match_by_title (string)."""
    uid = _normalize_user_id(user_id)
    if not uid:
        return None
    tid = _ensure_task_id_int(task_id)
    if tid is not None:
        task = await task_service.get_task_by_id(session, tid, uid)
        if task:
            return tid
    if match_by_title is not None and _looks_like_id(match_by_title):
        tid = _ensure_task_id_int(match_by_title)
        if tid is not None:
            task = await task_service.get_task_by_id(session, tid, uid)
            if task:
                return tid
    if match_by_title is not None and str(match_by_title).strip() and not _looks_like_id(match_by_title):
        task = await task_service.get_task_by_title(session, uid, str(match_by_title).strip())
        if task:
            return task.id
    return None


async def add_task(session: AsyncSession, user_id: str, *, title: str, description: str | None = None) -> Dict[str, Any]:
    try:
        uid = _normalize_user_id(user_id)
        if not uid:
            return {"success": False, "error": "User not identified."}
        title = str(title or "").strip()
        if not title:
            return {"success": False, "error": "Task title cannot be empty."}
        desc = (description or "").strip() or None
        if not desc:
            desc = _auto_description(title)
        task_create = TaskCreate(title=title, description=desc, completed=False, user_id=uid)
        task = await task_service.create_task(session, task_create)
        return {"success": True, "task": {"id": task.id, "title": task.title, "description": task.description, "completed": task.completed}}
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception:
        return {"success": False, "error": "Could not create task. Please try again."}


async def list_tasks(session: AsyncSession, user_id: str, *, status: str = "all") -> Dict[str, Any]:
    try:
        uid = _normalize_user_id(user_id)
        if not uid:
            return {"success": False, "error": "User not identified.", "tasks": [], "summary": ""}
        tasks = await task_service.get_tasks_by_user(session, uid)
        if status == "completed":
            tasks = [t for t in tasks if t.completed]
        elif status == "pending":
            tasks = [t for t in tasks if not t.completed]
        task_list = []
        lines = []
        for t in tasks:
            status_label = "completed" if t.completed else "pending"
            display = f"ID {t.id}: {t.title or '(no title)'} ({status_label})"
            task_list.append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "completed": t.completed,
                "display": display,
            })
            lines.append(display)
        return {
            "success": True,
            "tasks": task_list,
            "summary": "\n".join(lines) if lines else "No tasks.",
        }
    except Exception:
        return {"success": False, "error": "Could not list tasks. Please try again.", "tasks": [], "summary": ""}


async def complete_task(
    session: AsyncSession,
    user_id: str,
    *,
    task_id: Any = None,
    match_by_title: str | None = None,
) -> Dict[str, Any]:
    try:
        tid = await _resolve_task_id(session, user_id, task_id, match_by_title)
        if tid is None:
            return {"success": False, "error": "I couldn't find that task."}
        task = await task_service.toggle_task_completion(session, tid, user_id)
        if not task:
            return {"success": False, "error": "I couldn't find that task."}
        return {"success": True, "task": {"id": task.id, "title": task.title, "completed": task.completed}}
    except Exception:
        return {"success": False, "error": "Something went wrong. Please try again."}


async def delete_task(
    session: AsyncSession,
    user_id: str,
    *,
    task_id: Any = None,
    match_by_title: str | None = None,
) -> Dict[str, Any]:
    try:
        tid = await _resolve_task_id(session, user_id, task_id, match_by_title)
        if tid is None:
            attempted_id = _ensure_task_id_int(task_id) or (_ensure_task_id_int(match_by_title) if _looks_like_id(match_by_title) else None)
            if attempted_id is not None:
                return {"success": False, "error": f"No task with ID {attempted_id} in your list. Check the dashboard for your task IDs."}
            return {"success": False, "error": "I couldn't find that task. Use a task ID from your list (e.g. delete task 5) or the exact task title."}
        deleted = await task_service.delete_task(session, tid, _normalize_user_id(user_id))
        if not deleted:
            return {"success": False, "error": f"No task with ID {tid} in your list."}
        return {"success": True, "message": "Task removed.", "deleted_id": tid}
    except Exception:
        return {"success": False, "error": "Something went wrong. Please try again."}


async def update_task(
    session: AsyncSession,
    user_id: str,
    *,
    task_id: Any = None,
    match_by_title: str | None = None,
    title: str | None = None,
    description: str | None = None,
) -> Dict[str, Any]:
    try:
        tid = await _resolve_task_id(session, user_id, task_id, match_by_title)
        if tid is None:
            return {"success": False, "error": "I couldn't find that task."}
        update_data = {}
        if title is not None and str(title).strip():
            update_data["title"] = str(title).strip()
        if description is not None:
            update_data["description"] = str(description).strip() if str(description).strip() else None
        if not update_data:
            return {"success": False, "error": "Provide title or description to update."}
        task = await task_service.update_task(session, tid, _normalize_user_id(user_id), update_data)
        if not task:
            return {"success": False, "error": "I couldn't find that task."}
        return {"success": True, "task": {"id": task.id, "title": task.title, "description": task.description}}
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception:
        return {"success": False, "error": "Something went wrong. Please try again."}


TOOL_HANDLERS = {
    "add_task": add_task,
    "list_tasks": list_tasks,
    "complete_task": complete_task,
    "delete_task": delete_task,
    "update_task": update_task,
}
