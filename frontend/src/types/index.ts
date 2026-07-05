export type DocumentStatus = "uploaded" | "processing" | "ready" | "failed";

export interface LegalDocument {
  id: string;
  filename: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  page_count: number;
  chunk_count: number;
  status: DocumentStatus;
  error_message: string | null;
  preview_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: LegalDocument[];
  total: number;
}

export interface DocumentUploadResponse {
  document: LegalDocument;
  message: string;
}

export interface SourceChunk {
  document_id: string;
  document_name: string;
  chunk_index: number;
  text: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: SourceChunk[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  document_id: string | null;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  conversation_id: string;
  message: ChatMessage;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskItem {
  clause: string;
  risk_level: RiskLevel;
  explanation: string;
  recommendation: string;
}

export interface ContractAnalysis {
  document_id: string;
  summary: string;
  key_clauses: string[];
  parties: string[];
  obligations: string[];
  risks: RiskItem[];
  generated_at: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  llm_provider: string;
  embedding_provider: string;
  vector_store_ready: boolean;
}

export interface ApiErrorBody {
  error_code: string;
  message: string;
}
