from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[int] = None


class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    tool_calls: List[Any] = Field(default_factory=list)


class ConversationOut(BaseModel):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
