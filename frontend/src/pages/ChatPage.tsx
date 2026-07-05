import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, FileText, Bot, User, Loader2, MessageSquarePlus } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/toast-context";
import {
  streamChatMessage,
  listDocuments,
  listConversations,
  getConversation,
  ApiError,
} from "../lib/api";
import type { ChatMessage, LegalDocument, Conversation, SourceChunk } from "../types";

interface DisplayMessage extends Omit<ChatMessage, "id"> {
  id: string;
  streaming?: boolean;
}

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const documentIdFromUrl = searchParams.get("document") ?? undefined;

  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(documentIdFromUrl);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    listDocuments().then((res) => setDocuments(res.documents.filter((d) => d.status === "ready")));
    listConversations().then((res) => setConversations(res.conversations));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (id: string) => {
    try {
      const convo = await getConversation(id);
      setConversationId(convo.id);
      setSelectedDocId(convo.document_id ?? undefined);
      setMessages(convo.messages);
    } catch {
      showToast("Could not load conversation.", "error");
    }
  };

  const startNewConversation = () => {
    setConversationId(undefined);
    setMessages([]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const userMsg: DisplayMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      sources: [],
      created_at: new Date().toISOString(),
    };
    const assistantMsgId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantMsgId, role: "assistant", content: "", sources: [], created_at: "", streaming: true },
    ]);

    let sources: SourceChunk[] = [];

    try {
      await streamChatMessage(
        {
          message: text,
          conversation_id: conversationId,
          document_id: selectedDocId,
        },
        (event) => {
          if (event.type === "sources") {
            sources = event.sources;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, sources } : m))
            );
          } else if (event.type === "token") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: m.content + event.content } : m
              )
            );
          } else if (event.type === "done") {
            setConversationId(event.conversation_id);
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m))
            );
          }
        }
      );
      listConversations().then((res) => setConversations(res.conversations));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: message, streaming: false } : m
        )
      );
      showToast(message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell title="Chat">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        {/* Conversation sidebar */}
        <GlassCard className="hidden w-64 shrink-0 flex-col p-4 md:flex">
          <Button variant="secondary" size="sm" className="mb-4 w-full" onClick={startNewConversation}>
            <MessageSquarePlus className="h-4 w-4" /> New chat
          </Button>
          <div className="mb-2 font-mono text-xs uppercase tracking-wide text-[var(--color-text-faint)]">
            Scope to document
          </div>
          <select
            value={selectedDocId ?? ""}
            onChange={(e) => setSelectedDocId(e.target.value || undefined)}
            className="mb-4 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="">All documents</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.original_filename}
              </option>
            ))}
          </select>

          <div className="mb-2 font-mono text-xs uppercase tracking-wide text-[var(--color-text-faint)]">
            History
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={`block w-full truncate rounded-lg px-2 py-2 text-left text-xs transition-colors ${
                  conversationId === c.id
                    ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                    : "text-[var(--color-text-muted)] hover:bg-white/5"
                }`}
              >
                {c.title || "New conversation"}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Message area */}
        <div className="flex flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-[var(--color-text-muted)]">
                <Bot className="mb-3 h-8 w-8 text-[var(--color-accent)]" />
                <p className="font-display text-lg text-[var(--color-text)]">Ask about your documents</p>
                <p className="mt-1 max-w-sm text-sm">
                  {selectedDocId
                    ? "Scoped to a single document — answers will cite exact clauses."
                    : "Searching across all your uploaded documents."}
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>

          <div className="mt-4 flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="max-h-32 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <Button onClick={handleSend} loading={sending} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={`max-w-2xl ${isUser ? "order-1" : ""}`}>
        <GlassCard
          className={`px-4 py-3 ${isUser ? "bg-[var(--color-accent-soft)] border-[var(--color-accent)]/20" : ""}`}
        >
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text)]">
            {message.content}
            {message.streaming && !message.content && (
              <Loader2 className="inline h-3.5 w-3.5 animate-spin text-[var(--color-text-muted)]" />
            )}
          </p>
        </GlassCard>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.sources.map((s, i) => (
              <div
                key={i}
                title={s.text}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 font-mono text-[10px] text-[var(--color-text-faint)]"
              >
                <FileText className="h-3 w-3" />
                {s.document_name} · chunk {s.chunk_index}
              </div>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-[var(--color-text-muted)]">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
