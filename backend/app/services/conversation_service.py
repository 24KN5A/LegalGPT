"""
Conversation & message persistence.

Keeps chat history in SQLite so the frontend can list past conversations
and reload them, and so the RAG pipeline can pass recent turns as context.
"""
import json
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConversationNotFoundError
from app.db.models import Conversation, Message, MessageRole
from app.services.llm.base import ChatTurn


async def get_or_create_conversation(
    db: AsyncSession, conversation_id: Optional[str], document_id: Optional[str], first_message: str
) -> Conversation:
    if conversation_id:
        result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
        convo = result.scalar_one_or_none()
        if convo is None:
            raise ConversationNotFoundError(f"Conversation '{conversation_id}' not found.")
        return convo

    title = (first_message[:60] + "...") if len(first_message) > 60 else first_message
    convo = Conversation(document_id=document_id, title=title or "New conversation")
    db.add(convo)
    await db.commit()
    await db.refresh(convo)
    return convo


async def get_history(db: AsyncSession, conversation_id: str, limit: int = 10) -> list[ChatTurn]:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = list(reversed(result.scalars().all()))
    return [
        {"role": m.role.value, "content": m.content}
        for m in messages
        if m.role in (MessageRole.USER, MessageRole.ASSISTANT)
    ]


async def add_message(
    db: AsyncSession,
    conversation_id: str,
    role: MessageRole,
    content: str,
    sources: Optional[list[dict]] = None,
) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        sources_json=json.dumps(sources) if sources else None,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def list_conversations(db: AsyncSession) -> list[Conversation]:
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_conversation(db: AsyncSession, conversation_id: str) -> Conversation:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(selectinload(Conversation.messages))
    )
    convo = result.scalar_one_or_none()
    if convo is None:
        raise ConversationNotFoundError(f"Conversation '{conversation_id}' not found.")
    return convo
