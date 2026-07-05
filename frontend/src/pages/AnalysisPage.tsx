import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldAlert, Users, ListChecks, FileText, Sparkles } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { RiskBadge } from "../components/ui/Badge";
import { useToast } from "../components/ui/toast-context";
import { listDocuments, analyzeDocument, ApiError } from "../lib/api";
import type { LegalDocument, ContractAnalysis } from "../types";

export default function AnalysisPage() {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(
    searchParams.get("document") ?? undefined
  );
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    listDocuments().then((res) => setDocuments(res.documents.filter((d) => d.status === "ready")));
  }, []);

  const runAnalysis = async (id: string) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeDocument(id);
      setAnalysis(result);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Analysis failed. Please make sure an LLM provider is configured.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Risk Analysis">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || undefined)}
          className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
        >
          <option value="">Select a document...</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.original_filename}
            </option>
          ))}
        </select>
        <Button
          onClick={() => selectedId && runAnalysis(selectedId)}
          disabled={!selectedId}
          loading={loading}
        >
          <Sparkles className="h-4 w-4" /> Run analysis
        </Button>
      </div>

      {documents.length === 0 && (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No ready documents"
          description="Upload and wait for a document to finish processing before running analysis."
        />
      )}

      {!analysis && !loading && documents.length > 0 && (
        <EmptyState
          icon={<ShieldAlert className="h-8 w-8" />}
          title="Select a document to analyze"
          description="LegalGPT will summarize the document, extract parties and obligations, and flag risky clauses by severity."
        />
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-[var(--color-text-muted)]">
          <Sparkles className="h-8 w-8 animate-pulse text-[var(--color-accent)]" />
          <p>Analyzing document...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="mb-3 font-display text-lg">Summary</h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{analysis.summary}</p>
          </GlassCard>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <GlassCard className="p-6">
              <h3 className="mb-3 flex items-center gap-2 font-display text-lg">
                <Users className="h-4 w-4 text-[var(--color-accent)]" /> Parties
              </h3>
              <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                {analysis.parties.length === 0 && <li>None identified.</li>}
                {analysis.parties.map((p, i) => (
                  <li key={i} className="rounded-lg border border-white/5 px-3 py-2">
                    {p}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="mb-3 flex items-center gap-2 font-display text-lg">
                <ListChecks className="h-4 w-4 text-[var(--color-accent)]" /> Key obligations
              </h3>
              <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
                {analysis.obligations.length === 0 && <li>None identified.</li>}
                {analysis.obligations.map((o, i) => (
                  <li key={i} className="rounded-lg border border-white/5 px-3 py-2">
                    {o}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          <GlassCard className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg">
              <ShieldAlert className="h-4 w-4 text-[var(--color-accent)]" /> Risk breakdown
            </h3>
            {analysis.risks.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No significant risks identified.</p>
            ) : (
              <div className="space-y-3">
                {analysis.risks.map((risk, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="font-medium text-[var(--color-text)]">{risk.clause}</span>
                      <RiskBadge level={risk.risk_level} />
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">{risk.explanation}</p>
                    <p className="mt-2 text-sm text-[var(--color-accent-strong)]">
                      → {risk.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <p className="text-center text-xs text-[var(--color-text-faint)]">
            Generated {new Date(analysis.generated_at).toLocaleString()} — informational only, not
            legal advice.
          </p>
        </div>
      )}
    </AppShell>
  );
}
