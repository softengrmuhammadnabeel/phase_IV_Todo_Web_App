from sqlmodel import create_engine, SQLModel

# Export Base for SQLAlchemy models
Base = SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import make_url
from typing import AsyncGenerator
from src.config import settings

def _get_db_urls():
    """Resolve async and sync DB URLs. Use SQLite if DATABASE_URL is missing/invalid."""
    raw = (settings.DATABASE_URL or "").strip().strip("'\"")
    if not raw or raw.lower() in ("none", "null", "''", '""'):
        return "sqlite+aiosqlite:///./app.db", "sqlite:///./app.db"
    try:
        make_url(raw)
    except Exception:
        return "sqlite+aiosqlite:///./app.db", "sqlite:///./app.db"
    async_url = raw
    sync_url = (
        raw.replace("postgresql+asyncpg", "postgresql+psycopg2", 1)
        if "postgresql+asyncpg" in raw
        else raw
    )
    return async_url, sync_url

_async_url, _sync_url = _get_db_urls()

async_engine = create_async_engine(_async_url)
sync_engine = create_engine(
    _sync_url,
    connect_args={"check_same_thread": False} if "sqlite" in _sync_url else {},
)

# Synchronous SessionLocal for sync DB operations
from sqlalchemy.orm import sessionmaker as sync_sessionmaker
SessionLocal = sync_sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

AsyncSessionLocal = sessionmaker(
    bind=async_engine, # type: ignore
    class_=AsyncSession,
    expire_on_commit=False,
) # type: ignore

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session: # type: ignore
        yield session

def init_db(): # Renamed to match your CLI command
    """Create database tables synchronously"""
    from src.models.task import Task
    from src.models.conversation import Conversation
    from src.models.message import Message
    SQLModel.metadata.create_all(sync_engine)

async def create_db_and_tables_async():
    """Create database tables asynchronously"""
    from src.models.task import Task
    from src.models.conversation import Conversation
    from src.models.message import Message
    async with async_engine.begin() as conn:
        # Corrected: run_sync passes the 'conn' automatically
        await conn.run_sync(SQLModel.metadata.create_all)