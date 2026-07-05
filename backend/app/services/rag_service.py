"""
Retrieval-Augmented Generation orchestration.

Pipeline:
  1. Embed the user's question and retrieve the top-k most relevant chunks
     from ChromaDB (optionally scoped to one or more documents).
  2. Build a grounded prompt that instructs the LLM to answer ONLY from the
     retrieved context and to say so when the answer isn't in the documents.
  3. Call the active LLM provider (via the abstraction, provider-agnostic).
  4. Return the answer text plus the source chunks used, for citation in
     the UI.
"""
from typing import AsyncIterator, List, Optional

from app.config import settings
from app.services.llm.base import ChatTurn
from app.services.llm.factory import get_llm_provider
from app.services.vector_store_service import get_vector_store

SYSTEM_PROMPT = """You are LegalGPT, an AI assistant specialized in analyzing legal documents \
and contracts. Answer the user's question using ONLY the context excerpts provided below, \
which were retrieved from the user's own uploaded documents.

Rules:
- Base your answer strictly on the provided context. Do not invent facts.
- If the context does not contain enough information to answer, say so clearly and suggest \
what the user could upload or ask instead.
- When relevant, refer to specific clauses or sections from the context.
- You are not a substitute for a licensed attorney; for binding legal decisions, remind the \
user to consult a qualified lawyer if the question concerns a significant legal decision.
- Be precise, professional, and concise.
"""


def _build_context_block(hits: list[dict]) -> str:
    if not hits:
        return "(No relevant context was found in the uploaded documents.)"
    parts = []
    for i, hit in enumerate(hits, start=1):
        meta = hit["metadata"]
        parts.append(
            f"[Source {i} - {meta.get('document_name', 'document')}, "
            f"chunk {meta.get('chunk_index', '?')}]\n{hit['text']}"
        )
    return "\n\n".join(parts)


def _build_messages(question: str, history: List[ChatTurn], context: str) -> List[ChatTurn]:
    messages: List[ChatTurn] = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history)
    messages.append(
        {
            "role": "user",
            "content": f"Context from uploaded documents:\n\n{context}\n\nQuestion: {question}",
        }
    )
    return messages


async def retrieve(
    question: str,
    document_id: Optional[str] = None,
    document_ids: Optional[List[str]] = None,
    top_k: Optional[int] = None,
) -> list[dict]:
    store = get_vector_store()
    return store.query(
        query_text=question,
        top_k=top_k or settings.retrieval_top_k,
        document_id=document_id,
        document_ids=document_ids,
    )


async def answer_question(
    question: str,
    history: Optional[List[ChatTurn]] = None,
    document_id: Optional[str] = None,
    document_ids: Optional[List[str]] = None,
) -> tuple[str, list[dict]]:
    """Run the full RAG pipeline and return (answer_text, source_hits)."""
    hits = await retrieve(question, document_id=document_id, document_ids=document_ids)
    context = _build_context_block(hits)
    messages = _build_messages(question, history or [], context)

    provider = get_llm_provider()
    answer = await provider.generate(
        messages, temperature=settings.llm_temperature, max_tokens=settings.llm_max_tokens
    )
    return answer, hits


async def stream_answer(
    question: str,
    history: Optional[List[ChatTurn]] = None,
    document_id: Optional[str] = None,
    document_ids: Optional[List[str]] = None,
) -> AsyncIterator[str]:
    """Stream the RAG answer token-by-token. Yields the source hits first as
    a special marker-free approach is avoided here -- callers should call
    `retrieve()` separately if they need sources alongside a stream."""
    hits = await retrieve(question, document_id=document_id, document_ids=document_ids)
    context = _build_context_block(hits)
    messages = _build_messages(question, history or [], context)

    provider = get_llm_provider()
    async for chunk in provider.stream(
        messages, temperature=settings.llm_temperature, max_tokens=settings.llm_max_tokens
    ):
        yield chunk
