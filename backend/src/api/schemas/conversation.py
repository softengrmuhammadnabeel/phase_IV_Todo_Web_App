from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ConversationBase(BaseModel):
    user_id: str


class ConversationCreate(ConversationBase):
    pass


class Conversation(BaseModel):
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
