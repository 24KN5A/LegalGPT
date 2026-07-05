import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Search, Trash2, UploadCloud } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/Badge";
import { useToast } from "../components/ui/toast-context";
import { listDocuments, deleteDocument } from "../lib/api";
import type { LegalDocument } from "../types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = () => {
    listDocuments()
      .then((res) => setDocuments(res.documents))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      documents.filter((d) =>
        d.original_filename.toLowerCase().includes(query.toLowerCase())
      ),
    [documents, query]
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      showToast("Document deleted.", "success");
    } catch {
      showToast("Could not delete document.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell title="Document Library">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>
        <Link to="/upload">
          <Button size="sm">
            <UploadCloud className="h-4 w-4" /> Upload
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading documents...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title={documents.length === 0 ? "No documents yet" : "No matches"}
          description={
            documents.length === 0
              ? "Upload your first document to build your library."
              : "Try a different search term."
          }
          action={
            documents.length === 0 && (
              <Link to="/upload">
                <Button size="sm">Upload a document</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <GlassCard key={doc.id} className="p-5" hoverable>
              <div className="mb-3 flex items-start justify-between">
                <FileText className="h-5 w-5 text-[var(--color-accent)]" />
                <StatusBadge status={doc.status} />
              </div>
              <Link to={`/library/${doc.id}`}>
                <h3 className="truncate font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]">
                  {doc.original_filename}
                </h3>
              </Link>
              <p className="mt-1 font-mono text-xs text-[var(--color-text-faint)]">
                {doc.page_count} pages · {formatBytes(doc.size_bytes)}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Link
                  to={`/library/${doc.id}`}
                  className="text-xs text-[var(--color-accent)] hover:underline"
                >
                  Open
                </Link>
                <button
                  onClick={() => handleDelete(doc.id, doc.original_filename)}
                  disabled={deletingId === doc.id}
                  className="rounded-lg p-1.5 text-[var(--color-text-faint)] hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                  aria-label={`Delete ${doc.original_filename}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
