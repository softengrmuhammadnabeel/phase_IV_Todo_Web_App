"""
Chat API: conversations and messages from DB (conversations + messages tables).
POST /api/{user_id}/chat — send message, run agent.
GET /api/{user_id}/conversations — list user conversations.
GET /api/{user_id}/conversations/{conversation_id}/messages — get messages for a conversation.
"""
import logging
from typing import cast

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps.auth import get_current_user_id
from src.api.schemas.chat import ChatRequest, ChatResponse, ConversationOut, MessageOut
from src.models.database import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from src.services.conversation_service import get_conversation, create_conversation, list_user_conversations, delete_conversation
from src.services.message_service import add_message, get_conversation_messages
from src.ai.runner import run

logger = logging.getLogger(__name__)

router = APIRouter()

# User-friendly message for 500 (no stack traces)
GENERIC_ERROR_DETAIL = "Something went wrong. Please try again later."


async def _get_or_create_conversation_id(
    session: AsyncSession,
    current_user_id: str,
    conversation_id_from_request: int | None,
) -> int | None:
    """Resolve to an existing conversation or create one; return its id."""
    if conversation_id_from_request is not None:
        conv = await get_conversation(
            session, conversation_id_from_request, current_user_id
        )
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        return conversation_id_from_request
    conv = await create_conversation(session, current_user_id)
    return conv.id


@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat(
    user_id: str,
    body: ChatRequest,
    current_user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Send a message and get an assistant response. Optionally pass conversation_id to continue a thread.
    """
    # 403 if path user_id does not match JWT
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID in path does not match authenticated user",
        )

    message_text = (body.message or "").strip()
    if not message_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    raw_cid = await _get_or_create_conversation_id(
        session, current_user_id, body.conversation_id
    )
    conversation_id = cast(int, raw_cid)

    # Run agent (SDK persists user + assistant via DbBackedSession.add_items)
    try:
        _, response_text, tool_calls_used = await run(
            session, current_user_id, conversation_id, message_text
        )
    except Exception as e:
        logger.exception("Chat run failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=GENERIC_ERROR_DETAIL,
        ) from e

    # Commit so task CRUD and any session-add_items are persisted
    await session.commit()

    # Fallback: if SDK did not persist messages (e.g. item format mismatch), ensure they are stored
    messages_after = await get_conversation_messages(session, conversation_id, current_user_id)
    if not messages_after or messages_after[-1].role != "assistant":
        await add_message(session, current_user_id, conversation_id, "user", message_text)
        await add_message(session, current_user_id, conversation_id, "assistant", response_text)
        await session.commit()

    return ChatResponse(
        conversation_id=conversation_id,
        response=response_text,
        tool_calls=tool_calls_used,
    )


@router.get("/{user_id}/conversations", response_model=list[ConversationOut])
async def list_conversations(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_async_session),
):
    """List conversations for the authenticated user (from conversations table)."""
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID in path does not match authenticated user",
        )
    conversations = await list_user_conversations(session, user_id)
    return conversations


@router.get("/{user_id}/conversations/{conversation_id:int}/messages", response_model=list[MessageOut])
async def get_messages(
    user_id: str,
    conversation_id: int,
    current_user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_async_session),
):
    """Get messages for a conversation (from messages table). User must own the conversation."""
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID in path does not match authenticated user",
        )
    conv = await get_conversation(session, conversation_id, user_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    messages = await get_conversation_messages(session, conversation_id, user_id)
    return messages


@router.delete("/{user_id}/conversations/{conversation_id:int}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation_route(
    user_id: str,
    conversation_id: int,
    current_user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_async_session),
):
    """Delete a conversation and its messages. User must own the conversation."""
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID in path does not match authenticated user",
        )
    deleted = await delete_conversation(session, conversation_id, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    await session.commit()
