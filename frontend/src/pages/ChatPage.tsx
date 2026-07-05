import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Send, FileText, Bot, User, Loader2, MessageSquarePlus, RotateCcw, Copy, Check, Zap } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import MarkdownMessage from "../components/chat/MarkdownMessage";
import { useToast } from "../components/ui/toast-context";
import {
  streamChatMessage,
  listDocuments,
  listConversations,
  getConversation,
  getHealth,
  ApiError,
} from "../lib/api";
import { recordLatency } from "../lib/metrics";
import type { ChatMessage, LegalDocument, Conversation, SourceChunk, HealthStatus } from "../types";

interface DisplayMessage extends Omit<ChatMessage, "id"> {
  id: string;
  streaming?: boolean;
}

const SUGGESTED_PROMPTS = [
  "Summarize the key obligations in this document",
  "What are the termination conditions?",
  "Are there any clauses that seem unusually risky?",
  "Who are the parties and what do they each owe?",
];

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const documentIdFromUrl = searchParams.get("document") ?? undefined;
  const conversationIdFromUrl = searchParams.get("conversation") ?? undefined;

  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(documentIdFromUrl);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<string>("");
  const idCounterRef = useRef(0);
  const { showToast } = useToast();

  const nextId = useCallback((prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  }, []);

  useEffect(() => {
    listDocuments().then((res) => setDocuments(res.documents.filter((d) => d.status === "ready")));
    listConversations().then((res) => setConversations(res.conversations));
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadConversation = useCallback(
    async (id: string) => {
      try {
        const convo = await getConversation(id);
        setConversationId(convo.id);
        setSelectedDocId(convo.document_id ?? undefined);
        setMessages(convo.messages);
      } catch {
        showToast("Could not load conversation.", "error");
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!conversationIdFromUrl) return;
    Promise.resolve().then(() => loadConversation(conversationIdFromUrl));
  }, [conversationIdFromUrl, loadConversation]);

  const startNewConversation = useCallback(() => {
    setConversationId(undefined);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || sending) return;
      setSending(true);
      lastUserMessageRef.current = text;

      const userMsg: DisplayMessage = {
        id: nextId("local"),
        role: "user",
        content: text,
        sources: [],
        created_at: new Date().toISOString(),
      };
      const assistantMsgId = nextId("local-assistant");
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantMsgId, role: "assistant", content: "", sources: [], created_at: "", streaming: true },
      ]);

      let sources: SourceChunk[] = [];
      const startedAt = Date.now();

      try {
        await streamChatMessage(
          { message: text, conversation_id: conversationId, document_id: selectedDocId },
          (event) => {
            if (event.type === "sources") {
              sources = event.sources;
              setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, sources } : m)));
            } else if (event.type === "token") {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, content: m.content + event.content } : m))
              );
            } else if (event.type === "done") {
              setConversationId(event.conversation_id);
              setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m)));
              const elapsed = Date.now() - startedAt;
              setLastLatency(elapsed);
              recordLatency(elapsed);
            }
          }
        );
        listConversations().then((res) => setConversations(res.conversations));
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
        setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: message, streaming: false } : m)));
        showToast(message, "error");
      } finally {
        setSending(false);
      }
    },
    [sending, conversationId, selectedDocId, showToast, nextId]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessage(text);
  }, [input, sendMessage]);

  const handleRegenerate = useCallback(() => {
    if (!lastUserMessageRef.current || sending) return;
    setMessages((prev) => prev.slice(0, -2));
    sendMessage(lastUserMessageRef.current);
  }, [sending, sendMessage]);

  return (
    <AppShell title="Chat">
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        <GlassCard className="hidden w-64 shrink-0 flex-col p-4 md:flex" animate={false}>
          <Button variant="secondary" size="sm" className="mb-4 w-full" onClick={startNewConversation}>
            <MessageSquarePlus className="h-4 w-4" /> New chat
          </Button>
          <div className="mb-2 font-mono text-xs uppercase tracking-wide text-[var(--color-text-faint)]">
            Scope to document
          </div>
          <select
            value={selectedDocId ?? ""}
            onChange={(e) => setSelectedDocId(e.target.value || undefined)}
            className="mb-4 w-full rounded-lg border px-2 py-2 text-xs focus:outline-none"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <option value="">All documents</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.original_filename}
              </option>
            ))}
          </select>

          <div className="mb-2 font-mono text-xs uppercase tracking-wide text-[var(--color-text-faint)]">History</div>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className="block w-full truncate rounded-lg px-2 py-2 text-left text-xs transition-colors"
                style={{
                  background: conversationId === c.id ? "var(--color-accent-soft)" : "transparent",
                  color: conversationId === c.id ? "var(--color-accent-strong)" : "var(--color-text-muted)",
                }}
              >
                {c.title || "New conversation"}
              </button>
            ))}
          </div>

          {health && (
            <div className="mt-3 flex items-center gap-1.5 border-t pt-3 font-mono text-[10px] text-[var(--color-text-faint)]" style={{ borderColor: "var(--color-border)" }}>
              <Bot className="h-3 w-3" /> {health.llm_provider}
              {lastLatency && (
                <span className="ml-auto flex items-center gap-1">
                  <Zap className="h-3 w-3" /> {lastLatency}ms
                </span>
              )}
            </div>
          )}
        </GlassCard>

        <div className="flex flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-[var(--color-text-muted)]">
                <Bot className="mb-3 h-8 w-8" style={{ color: "var(--color-accent)" }} />
                <p className="font-display text-lg text-[var(--color-text)]">Ask about your documents</p>
                <p className="mt-1 max-w-sm text-sm">
                  {selectedDocId
                    ? "Scoped to a single document — answers will cite exact clauses."
                    : "Searching across all your uploaded documents."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-[var(--color-accent)]"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onRegenerate={
                    !msg.streaming && msg.role === "assistant" && i === messages.length - 1 ? handleRegenerate : undefined
                  }
                />
              ))}
            </AnimatePresence>
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
              className="max-h-32 flex-1 resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
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

function MessageBubble({
  message,
  onRegenerate,
}: {
  message: DisplayMessage;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-strong)" }}
        >
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={`max-w-2xl ${isUser ? "order-1" : ""}`}>
        <GlassCard
          animate={false}
          className="px-4 py-3"
          style={isUser ? { background: "var(--color-accent-soft)", borderColor: "var(--color-accent)" } : undefined}
        >
          {isUser ? (
            <p className="whitespace-pre-line text-sm leading-relaxed">{message.content}</p>
          ) : (
            <>
              <MarkdownMessage content={message.content} />
              {message.streaming && !message.content && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-text-muted)]" />
              )}
            </>
          )}
        </GlassCard>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.sources.map((s, i) => (
              <div
                key={i}
                title={s.text}
                className="flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] text-[var(--color-text-faint)]"
                style={{ borderColor: "var(--color-border)" }}
              >
                <FileText className="h-3 w-3" />
                {s.document_name} · chunk {s.chunk_index}
              </div>
            ))}
          </div>
        )}

        {!isUser && !message.streaming && message.content && (
          <div className="mt-1.5 flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
              >
                <RotateCcw className="h-3 w-3" /> Regenerate
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--color-border)" }}>
          <User className="h-4 w-4 text-[var(--color-text-muted)]" />
        </div>
      )}
    </motion.div>
  );
}
