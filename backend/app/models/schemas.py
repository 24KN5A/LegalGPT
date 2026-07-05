"""
Pydantic schemas shared across API routes.

Keeping these centralized (instead of raw dicts in each route) gives us
request validation, OpenAPI docs, and a single source of truth for the
frontend TypeScript types to mirror.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------- Documents ----------

class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    content_type: str
    size_bytes: int
    page_count: int
    chunk_count: int
    status: str
    error_message: Optional[str] = None
    preview_text: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int


class DocumentUploadResponse(BaseModel):
    document: DocumentResponse
    message: str = "Document uploaded and is being processed."


# ---------- Chat / RAG ----------

class SourceChunk(BaseModel):
    document_id: str
    document_name: str
    chunk_index: int
    text: str
    score: float


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    conversation_id: Optional[str] = None
    document_id: Optional[str] = None  # scope retrieval to a single document
    document_ids: Optional[List[str]] = None  # or scope to a set of documents


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: List[SourceChunk] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    conversation_id: str
    message: ChatMessageResponse


class ConversationResponse(BaseModel):
    id: str
    title: str
    document_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]


# ---------- Contract / Risk Analysis ----------

class RiskItem(BaseModel):
    clause: str
    risk_level: str  # low | medium | high | critical
    explanation: str
    recommendation: str


class ContractAnalysisResponse(BaseModel):
    document_id: str
    summary: str
    key_clauses: List[str]
    parties: List[str]
    obligations: List[str]
    risks: List[RiskItem]
    generated_at: datetime


# ---------- Health / Errors ----------

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    llm_provider: str
    embedding_provider: str
    vector_store_ready: bool


class ErrorResponse(BaseModel):
    error_code: str
    message: str
