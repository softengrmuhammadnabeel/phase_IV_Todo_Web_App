from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"  # type: ignore

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
