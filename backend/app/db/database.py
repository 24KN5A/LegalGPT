"""
Async SQLAlchemy engine + session factory backed by SQLite.

SQLite is sufficient here because LegalGPT only stores lightweight metadata
(document records, conversations, messages) -- the heavy lifting (semantic
search over chunk text) lives in ChromaDB, not this database.
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    f"sqlite+aiosqlite:///{settings.sqlite_path}",
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


async def init_db() -> None:
    """Create tables on startup if they don't already exist."""
    # Import models so they're registered on Base.metadata before create_all.
    from app.db import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
