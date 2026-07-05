import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, MessageSquare, UploadCloud, ShieldAlert, ArrowRight } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/Badge";
import { listDocuments, listConversations } from "../lib/api";
import type { LegalDocument, Conversation } from "../types";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listDocuments(), listConversations()])
      .then(([docsRes, convosRes]) => {
        setDocuments(docsRes.documents);
        setConversations(convosRes.conversations);
      })
      .finally(() => setLoading(false));
  }, []);

  const readyDocs = documents.filter((d) => d.status === "ready").length;
  const processingDocs = documents.filter((d) => d.status === "processing").length;

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Documents" value={documents.length} />
        <StatCard icon={ShieldAlert} label="Ready for analysis" value={readyDocs} />
        <StatCard icon={UploadCloud} label="Processing" value={processingDocs} />
        <StatCard icon={MessageSquare} label="Conversations" value={conversations.length} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent documents</h2>
            <Link to="/library" className="text-sm text-[var(--color-accent)] hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No documents yet"
              description="Upload a contract, NDA, or filing to start asking questions and running risk analysis."
              action={
                <Link to="/upload">
                  <Button size="sm">
                    Upload a document <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 5).map((doc) => (
                <Link
                  key={doc.id}
                  to={`/library/${doc.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/5 px-4 py-3 text-sm transition-colors hover:border-white/10 hover:bg-white/[0.02]"
                >
                  <span className="truncate text-[var(--color-text)]">{doc.original_filename}</span>
                  <StatusBadge status={doc.status} />
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-4 font-display text-lg">Quick actions</h2>
          <div className="space-y-2">
            <Link to="/upload" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <UploadCloud className="h-4 w-4" /> Upload a document
              </Button>
            </Link>
            <Link to="/chat" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <MessageSquare className="h-4 w-4" /> Start a chat
              </Button>
            </Link>
            <Link to="/analysis" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <ShieldAlert className="h-4 w-4" /> Run risk analysis
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
}) {
  return (
    <GlassCard className="p-5">
      <Icon className="mb-3 h-5 w-5 text-[var(--color-accent)]" />
      <div className="font-display text-3xl text-[var(--color-text)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--color-text-muted)]">{label}</div>
    </GlassCard>
  );
}
