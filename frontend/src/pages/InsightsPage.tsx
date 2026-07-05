import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Crosshair, Gauge, ListChecks, RefreshCw } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import ErrorState from "../components/ui/ErrorState";
import GlassCard from "../components/ui/GlassCard";
import Skeleton from "../components/ui/Skeleton";
import MetricSummaryCard from "../components/evaluation/MetricSummaryCard";
import ConfusionMatrix from "../components/evaluation/ConfusionMatrix";
import ClassMetricsTable from "../components/evaluation/ClassMetricsTable";
import { getRiskClassifierEvaluation, ApiError } from "../lib/api";
import type { EvaluationResult } from "../types";

export default function InsightsPage() {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getRiskClassifierEvaluation()
      .then(setResult)
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Could not load evaluation results.";
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell title="Model Evaluation & Results">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
          Standard classification metrics for LegalGPT's rule-based contract risk classifier, computed against a
          hand-labeled benchmark of clause excerpts. Runs locally and deterministically — no LLM call required.
        </p>
        <Button variant="secondary" size="sm" onClick={load} loading={loading}>
          <RefreshCw className="h-4 w-4" /> Re-run evaluation
        </Button>
      </div>

      {error && !loading && <ErrorState message={error} onRetry={load} />}

      {loading && !result && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </div>
      )}

      {result && !error && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricSummaryCard icon={Target} label="Accuracy" value={result.accuracy} delay={0} />
            <MetricSummaryCard icon={Crosshair} label="Macro Precision" value={result.macro_avg.precision} delay={0.05} />
            <MetricSummaryCard icon={Gauge} label="Macro Recall" value={result.macro_avg.recall} delay={0.1} />
            <MetricSummaryCard icon={ListChecks} label="Macro F1" value={result.macro_avg.f1} delay={0.15} />
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ConfusionMatrix labels={result.labels} matrix={result.confusion_matrix} />
            <ClassMetricsTable
              perClass={result.per_class}
              macroAvg={result.macro_avg}
              weightedAvg={result.weighted_avg}
            />
          </div>

          <GlassCard className="p-5 text-xs text-[var(--color-text-faint)]" hoverable>
            <span className="font-medium text-[var(--color-text-muted)]">Methodology: </span>
            {result.model_name} evaluated on {result.num_samples} labeled samples from{" "}
            {result.dataset_name.toLowerCase()}, across {result.labels.length} risk classes ({result.labels.join(", ")}
            ). Metrics follow standard multi-class definitions (precision, recall, F1 per class; macro-average
            treats all classes equally; weighted-average accounts for class support).
          </GlassCard>
        </div>
      )}
    </AppShell>
  );
}
