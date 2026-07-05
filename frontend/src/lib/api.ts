import type {
  ChatResponse,
  Conversation,
  ContractAnalysis,
  DocumentListResponse,
  DocumentUploadResponse,
  HealthStatus,
  LegalDocument,
} from "../types";

// In dev, Vite proxies /api -> http://localhost:8000 (see vite.config.ts).
// In production, set VITE_API_BASE_URL to the deployed backend origin.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  errorCode: string;
  status: number;

  constructor(status: number, errorCode: string, message: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: { error_code?: string; message?: string; detail?: string } = {};
    try {
      body = await res.json();
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(
      res.status,
      body.error_code ?? "unknown_error",
      body.message ?? body.detail ?? `Request failed with status ${res.status}`
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Health ----------

export async function getHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse<HealthStatus>(res);
}

// ---------- Documents ----------

export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void
): Promise<DocumentUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: { error_code?: string; message?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as DocumentUploadResponse);
      } else {
        reject(
          new ApiError(
            xhr.status,
            body.error_code ?? "unknown_error",
            body.message ?? "Upload failed"
          )
        );
      }
    };

    xhr.onerror = () => reject(new ApiError(0, "network_error", "Network error during upload"));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export async function listDocuments(): Promise<DocumentListResponse> {
  const res = await fetch(`${BASE_URL}/documents`);
  return handleResponse<DocumentListResponse>(res);
}

export async function getDocument(id: string): Promise<LegalDocument> {
  const res = await fetch(`${BASE_URL}/documents/${id}`);
  return handleResponse<LegalDocument>(res);
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/documents/${id}`, { method: "DELETE" });
  return handleResponse<void>(res);
}

// ---------- Chat ----------

export async function sendChatMessage(params: {
  message: string;
  conversation_id?: string;
  document_id?: string;
  document_ids?: string[];
}): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return handleResponse<ChatResponse>(res);
}

export type StreamEvent =
  | { type: "sources"; sources: ChatResponse["message"]["sources"] }
  | { type: "token"; content: string }
  | { type: "done"; conversation_id: string; message_id: string };

/** Consumes the newline-delimited-JSON streaming chat endpoint. */
export async function streamChatMessage(
  params: { message: string; conversation_id?: string; document_id?: string; document_ids?: string[] },
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });

  if (!res.ok || !res.body) {
    let body: { error_code?: string; message?: string } = {};
    try {
      body = await res.json();
    } catch {
      /* ignore */
    }
    throw new ApiError(
      res.status,
      body.error_code ?? "unknown_error",
      body.message ?? "Streaming request failed"
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      onEvent(JSON.parse(line) as StreamEvent);
    }
  }
  if (buffer.trim()) {
    onEvent(JSON.parse(buffer) as StreamEvent);
  }
}

export async function listConversations(): Promise<{ conversations: Conversation[] }> {
  const res = await fetch(`${BASE_URL}/conversations`);
  return handleResponse(res);
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${BASE_URL}/conversations/${id}`);
  return handleResponse<Conversation>(res);
}

// ---------- Analysis ----------

export async function analyzeDocument(documentId: string): Promise<ContractAnalysis> {
  const res = await fetch(`${BASE_URL}/analysis/${documentId}`, { method: "POST" });
  return handleResponse<ContractAnalysis>(res);
}
