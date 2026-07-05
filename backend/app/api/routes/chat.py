import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.database import get_db
from app.db.models import MessageRole, User
from app.models.schemas import (
    ChatMessageResponse,
    ChatRequest,
    ChatResponse,
    ConversationListResponse,
    ConversationResponse,
    SourceChunk,
)
from app.services import conversation_service, rag_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convo = await conversation_service.get_or_create_conversation(
        db, request.conversation_id, request.document_id, request.message, user_id=current_user.id
    )
    history = await conversation_service.get_history(db, convo.id)

    await conversation_service.add_message(db, convo.id, MessageRole.USER, request.message)

    answer, hits = await rag_service.answer_question(
        request.message,
        history=history,
        document_id=request.document_id,
        document_ids=request.document_ids,
    )

    sources = [
        {
            "document_id": h["metadata"]["document_id"],
            "document_name": h["metadata"]["document_name"],
            "chunk_index": h["metadata"]["chunk_index"],
            "text": h["text"],
            "score": h["score"] or 0.0,
        }
        for h in hits
    ]

    assistant_msg = await conversation_service.add_message(
        db, convo.id, MessageRole.ASSISTANT, answer, sources=sources
    )

    return ChatResponse(
        conversation_id=convo.id,
        message=ChatMessageResponse(
            id=assistant_msg.id,
            role="assistant",
            content=answer,
            sources=[SourceChunk(**s) for s in sources],
            created_at=assistant_msg.created_at,
        ),
    )


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Server-Sent-Events style streaming response for the chat UI.

    Emits newline-delimited JSON events:
      {"type": "sources", "sources": [...]}
      {"type": "token", "content": "..."}
      {"type": "done", "conversation_id": "...", "message_id": "..."}
    """
    convo = await conversation_service.get_or_create_conversation(
        db, request.conversation_id, request.document_id, request.message, user_id=current_user.id
    )
    history = await conversation_service.get_history(db, convo.id)
    await conversation_service.add_message(db, convo.id, MessageRole.USER, request.message)

    hits = await rag_service.retrieve(
        request.message, document_id=request.document_id, document_ids=request.document_ids
    )
    sources = [
        {
            "document_id": h["metadata"]["document_id"],
            "document_name": h["metadata"]["document_name"],
            "chunk_index": h["metadata"]["chunk_index"],
            "text": h["text"],
            "score": h["score"] or 0.0,
        }
        for h in hits
    ]

    async def event_generator():
        yield json.dumps({"type": "sources", "sources": sources}) + "\n"
        full_text = ""
        async for token in rag_service.stream_answer(
            request.message,
            history=history,
            document_id=request.document_id,
            document_ids=request.document_ids,
        ):
            full_text += token
            yield json.dumps({"type": "token", "content": token}) + "\n"

        msg = await conversation_service.add_message(
            db, convo.id, MessageRole.ASSISTANT, full_text, sources=sources
        )
        yield json.dumps(
            {"type": "done", "conversation_id": convo.id, "message_id": msg.id}
        ) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    convos = await conversation_service.list_conversations(db, user_id=current_user.id)
    return ConversationListResponse(
        conversations=[_to_conversation_response(c) for c in convos]
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convo = await conversation_service.get_conversation(db, conversation_id, user_id=current_user.id)
    return _to_conversation_response(convo)


def _to_conversation_response(convo) -> ConversationResponse:
    return ConversationResponse(
        id=convo.id,
        title=convo.title,
        document_id=convo.document_id,
        created_at=convo.created_at,
        updated_at=convo.updated_at,
        messages=[
            ChatMessageResponse(
                id=m.id,
                role=m.role.value,
                content=m.content,
                sources=[SourceChunk(**s) for s in json.loads(m.sources_json)]
                if m.sources_json
                else [],
                created_at=m.created_at,
            )
            for m in convo.messages
        ],
    )
