"""
CRUD tools for the OpenAI Agents SDK (function_tool).
Tools receive RunContextWrapper[AgentContext] for session and user_id.
See: https://openai.github.io/openai-agents-python/tools/
"""
import json
import logging
from typing import Any

from agents import RunContextWrapper, function_tool

from src.ai.context import AgentContext
from src.services import task_service
from src.models.task import TaskCreate

logger = logging.getLogger(__name__)


def _uid(ctx: RunContextWrapper[AgentContext]) -> str:
    return str(ctx.context.user_id or "").strip()


def _session(ctx: RunContextWrapper[AgentContext]):
    return ctx.context.db_session


def _task_id_int(value: Any) -> int | None:
    """Coerce task_id from model (may be int or str) to int."""
    if value is None:
        return None
    if isinstance(value, int):
        return value if value > 0 else None
    if isinstance(value, float):
        if value != int(value) or value < 1:
            return None
        return int(value)
    try:
        s = str(value).strip()
        if s.isdigit():
            tid = int(s)
            return tid if tid > 0 else None
    except (ValueError, TypeError):
        pass
    return None


@function_tool
async def add_task(
    ctx: RunContextWrapper[AgentContext],
    title: str,
    description: str | None = None,
) -> str:
    """Create a new task. Use for 'create a task named X', 'add task X', 'create a task about X'. For 'about X' use title=X and set description to a short phrase. If no description, one is auto-generated."""
    try:
        uid = _uid(ctx)
        if not uid:
            return json.dumps({"success": False, "error": "User not identified."})
        title = str(title or "").strip()
        if not title:
            return json.dumps({"success": False, "error": "Task title cannot be empty."})
        desc = (description or "").strip() or None
        if not desc:
            desc = f"Task: {title}."
        task_create = TaskCreate(title=title, description=desc, completed=False, user_id=uid)
        task = await task_service.create_task(_session(ctx), task_create)
        return json.dumps({"success": True, "task": {"id": task.id, "title": task.title, "description": task.description, "completed": task.completed}})
    except ValueError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception:
        return json.dumps({"success": False, "error": "Could not create task. Please try again."})


@function_tool
async def list_tasks(
    ctx: RunContextWrapper[AgentContext],
    status: str = "all",
) -> str:
    """List the user's tasks. Always show each task with its ID so users can say 'delete task 5'. status: 'all', 'pending', or 'completed'."""
    try:
        uid = _uid(ctx)
        if not uid:
            return json.dumps({"success": False, "error": "User not identified.", "tasks": [], "summary": ""})
        tasks = await task_service.get_tasks_by_user(_session(ctx), uid)
        if status == "completed":
            tasks = [t for t in tasks if t.completed]
        elif status == "pending":
            tasks = [t for t in tasks if not t.completed]
        task_list = []
        lines = []
        for t in tasks:
            label = "completed" if t.completed else "pending"
            display = f"ID {t.id}: {t.title or '(no title)'} ({label})"
            task_list.append({"id": t.id, "title": t.title, "description": t.description, "completed": t.completed, "display": display})
            lines.append(display)
        return json.dumps({"success": True, "tasks": task_list, "summary": "\n".join(lines) if lines else "No tasks."})
    except Exception:
        return json.dumps({"success": False, "error": "Could not list tasks.", "tasks": [], "summary": ""})


async def _resolve_task_id(
    ctx: RunContextWrapper[AgentContext],
    task_id: Any,
    match_by_title: str | None,
) -> int | None:
    """Resolve to task id from task_id (number or numeric string) or match_by_title."""
    uid = _uid(ctx)
    if not uid:
        return None
    sess = _session(ctx)
    # Prefer explicit task_id (coerce int or string like "28")
    tid = _task_id_int(task_id)
    if tid is not None:
        task = await task_service.get_task_by_id(sess, tid, uid)
        if task:
            return tid
    # If match_by_title looks like a number, try as id
    if match_by_title is not None:
        tid = _task_id_int(match_by_title)
        if tid is not None:
            task = await task_service.get_task_by_id(sess, tid, uid)
            if task:
                return tid
    # By title (non-numeric)
    if match_by_title and str(match_by_title).strip() and not str(match_by_title).strip().isdigit():
        task = await task_service.get_task_by_title(sess, uid, str(match_by_title).strip())
        if task:
            return task.id
    return None


@function_tool
async def complete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: int | str | None = None,
    match_by_title: str | None = None,
) -> str:
    """Mark a task as completed. Use task_id when user says 'complete task 123' or 'task id 123'. Use match_by_title when user refers by name only."""
    try:
        tid = await _resolve_task_id(ctx, task_id, match_by_title)
        if tid is None:
            return json.dumps({"success": False, "error": "I couldn't find that task."})
        task = await task_service.toggle_task_completion(_session(ctx), tid, _uid(ctx))
        if not task:
            return json.dumps({"success": False, "error": "I couldn't find that task."})
        return json.dumps({"success": True, "task": {"id": task.id, "title": task.title, "completed": task.completed}})
    except Exception:
        return json.dumps({"success": False, "error": "Something went wrong. Please try again."})


@function_tool
async def delete_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: int | str | None = None,
    match_by_title: str | None = None,
) -> str:
    """Delete a task. Use task_id (integer) when user says 'delete task 123', 'remove task id 123', or 'delete the task for id 28'. Use match_by_title only when user refers to task by name (e.g. 'remove Bike Lover')."""
    try:
        tid = await _resolve_task_id(ctx, task_id, match_by_title)
        if tid is None:
            attempted = _task_id_int(task_id) or _task_id_int(match_by_title)
            if attempted is not None:
                return json.dumps({"success": False, "error": f"No task with ID {attempted} in your list. Check the dashboard for your task IDs."})
            return json.dumps({"success": False, "error": "I couldn't find that task. Use a task ID from your list (e.g. delete task 5) or the exact task title."})
        deleted = await task_service.delete_task(_session(ctx), tid, _uid(ctx))
        if not deleted:
            return json.dumps({"success": False, "error": f"No task with ID {tid} in your list."})
        return json.dumps({"success": True, "message": "Task removed.", "deleted_id": tid})
    except Exception:
        return json.dumps({"success": False, "error": "Something went wrong. Please try again."})


@function_tool
async def update_task(
    ctx: RunContextWrapper[AgentContext],
    task_id: int | str | None = None,
    match_by_title: str | None = None,
    title: str | None = None,
    description: str | None = None,
) -> str:
    """Update a task's title or description. Use task_id when user says 'update task 123'. Use match_by_title when user refers by name. Set title and/or description to the new values."""
    try:
        tid = await _resolve_task_id(ctx, task_id, match_by_title)
        if tid is None:
            return json.dumps({"success": False, "error": "I couldn't find that task."})
        update_data = {}
        if title is not None and str(title).strip():
            update_data["title"] = str(title).strip()
        if description is not None:
            update_data["description"] = str(description).strip() or None
        if not update_data:
            return json.dumps({"success": False, "error": "Provide title or description to update."})
        task = await task_service.update_task(_session(ctx), tid, _uid(ctx), update_data)
        if not task:
            return json.dumps({"success": False, "error": "I couldn't find that task."})
        return json.dumps({"success": True, "task": {"id": task.id, "title": task.title, "description": task.description}})
    except ValueError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception:
        return json.dumps({"success": False, "error": "Something went wrong. Please try again."})


def get_crud_tools():
    """Return list of CRUD function tools for the Agent."""
    return [add_task, list_tasks, complete_task, delete_task, update_task]
