import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { useToast } from "../components/ui/toast-context";
import { uploadDocument, getDocument, ApiError } from "../lib/api";
import type { DocumentStatus } from "../types";

interface UploadItem {
  id: string;
  filename: string;
  progress: number;
  status: DocumentStatus | "uploading" | "error";
  error?: string;
  documentId?: string;
}

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 40;

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const pollStatus = useCallback((localId: string, documentId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const doc = await getDocument(documentId);
        setItems((prev) =>
          prev.map((it) => (it.id === localId ? { ...it, status: doc.status } : it))
        );
        if (doc.status === "ready") {
          clearInterval(interval);
          showToast(`${doc.original_filename} is ready.`, "success");
        } else if (doc.status === "failed") {
          clearInterval(interval);
          setItems((prev) =>
            prev.map((it) =>
              it.id === localId ? { ...it, error: doc.error_message ?? "Processing failed" } : it
            )
          );
          showToast(`${doc.original_filename} failed to process.`, "error");
        } else if (attempts >= MAX_POLLS) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);
  }, [showToast]);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      Array.from(fileList).forEach((file) => {
        const localId = `${file.name}-${Date.now()}-${Math.random()}`;
        setItems((prev) => [
          ...prev,
          { id: localId, filename: file.name, progress: 0, status: "uploading" },
        ]);

        uploadDocument(file, (pct) => {
          setItems((prev) => prev.map((it) => (it.id === localId ? { ...it, progress: pct } : it)));
        })
          .then((res) => {
            setItems((prev) =>
              prev.map((it) =>
                it.id === localId
                  ? { ...it, status: res.document.status, documentId: res.document.id, progress: 100 }
                  : it
              )
            );
            pollStatus(localId, res.document.id);
          })
          .catch((err: unknown) => {
            const message =
              err instanceof ApiError ? err.message : "Upload failed. Please try again.";
            setItems((prev) =>
              prev.map((it) => (it.id === localId ? { ...it, status: "error", error: message } : it))
            );
            showToast(message, "error");
          });
      });
    },
    [pollStatus, showToast]
  );

  return (
    <AppShell title="Upload">
      <div className="mx-auto max-w-3xl">
        <GlassCard
          className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed px-8 py-16 text-center transition-colors ${
            dragActive ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]" : "border-white/10"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <UploadCloud className="h-10 w-10 text-[var(--color-accent)]" />
          <div>
            <p className="font-display text-lg">Drop a PDF here</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              or click to browse — contracts, NDAs, filings up to 25MB
            </p>
          </div>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </GlassCard>

        {items.length > 0 && (
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <GlassCard key={item.id} className="flex items-center gap-4 p-4">
                <FileText className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm text-[var(--color-text)]">{item.filename}</span>
                    <StatusLabel item={item} />
                  </div>
                  {item.status === "uploading" && (
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.error && (
                    <p className="mt-1 text-xs text-red-400">{item.error}</p>
                  )}
                </div>
                {item.documentId && item.status === "ready" && (
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/library/${item.documentId}`)}>
                    View
                  </Button>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatusLabel({ item }: { item: UploadItem }) {
  if (item.status === "uploading") {
    return <span className="text-xs text-[var(--color-text-muted)]">{item.progress}%</span>;
  }
  if (item.status === "processing" || item.status === "uploaded") {
    return (
      <span className="flex items-center gap-1 text-xs text-[var(--color-accent-strong)]">
        <Loader2 className="h-3 w-3 animate-spin" /> Processing
      </span>
    );
  }
  if (item.status === "ready") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </span>
    );
  }
  if (item.status === "failed" || item.status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-red-400">
        <XCircle className="h-3 w-3" /> Failed
      </span>
    );
  }
  return null;
}
