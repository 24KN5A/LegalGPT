import { useEffect, useState } from "react";
import { Cpu, Database, Sparkles } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import GlassCard from "../components/ui/GlassCard";
import { getHealth } from "../lib/api";
import type { HealthStatus } from "../types";

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setError(true));
  }, []);

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <GlassCard className="p-6">
          <h2 className="mb-4 font-display text-lg">System status</h2>
          {error && (
            <p className="text-sm text-red-400">
              Could not reach the LegalGPT API. Make sure the backend is running.
            </p>
          )}
          {!error && !health && (
            <p className="text-sm text-[var(--color-text-muted)]">Checking status...</p>
          )}
          {health && (
            <div className="space-y-4">
              <Row
                icon={Sparkles}
                label="LLM provider"
                value={health.llm_provider}
                hint={
                  health.llm_provider === "ollama"
                    ? "Local, free — requires Ollama running with a pulled model."
                    : "Requires an API key set in the backend .env file."
                }
              />
              <Row
                icon={Cpu}
                label="Embedding provider"
                value={health.embedding_provider}
                hint={
                  health.embedding_provider === "local"
                    ? "Local sentence-transformers model, no API key required."
                    : "Requires OPENAI_API_KEY in the backend .env file."
                }
              />
              <Row
                icon={Database}
                label="Vector store"
                value={health.vector_store_ready ? "Connected" : "Unavailable"}
              />
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-3 font-display text-lg">Changing providers</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
            LegalGPT's LLM and embedding providers are configured via environment variables in
            the backend's <code className="font-mono text-[var(--color-accent-strong)]">.env</code> file
            (see <code className="font-mono text-[var(--color-accent-strong)]">.env.example</code>).
            Set <code className="font-mono text-[var(--color-accent-strong)]">LLM_PROVIDER</code> to{" "}
            <code className="font-mono">ollama</code>, <code className="font-mono">openai</code>, or{" "}
            <code className="font-mono">anthropic</code>, then restart the backend.
          </p>
        </GlassCard>
      </div>
    </AppShell>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-xs text-[var(--color-text)]">
            {value}
          </span>
        </div>
        {hint && <p className="mt-1 text-xs text-[var(--color-text-faint)]">{hint}</p>}
      </div>
    </div>
  );
}
