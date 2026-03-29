from pydantic import BaseModel
from datetime import datetime


class MessageBase(BaseModel):
    user_id: str
    conversation_id: int
    role: str  # "user" or "assistant"
    content: str


class MessageCreate(MessageBase):
    pass


class Message(BaseModel):
    id: int
    user_id: str
    conversation_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
