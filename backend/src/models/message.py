from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class Message(SQLModel, table=True):
    __tablename__ = "messages"  # type: ignore

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    conversation_id: int = Field(foreign_key="conversations.id", nullable=False)
    role: str = Field(max_length=20, nullable=False)  # "user" or "assistant"
    content: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
