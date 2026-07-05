import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ListChecks,
  Users,
  ClipboardList,
  Banknote,
  CalendarClock,
  PackageCheck,
  CreditCard,
  Lock,
  Ban,
  Gavel,
  Tags,
  Sparkles,
  HelpCircle,
  Lightbulb,
  ChevronDown,
  Copy,
  Check,
  type LucideIcon,
} from "lucide-react";
import GlassCard from "../ui/GlassCard";
import type { InsightSection } from "../../lib/insights";
import type { SourceChunk } from "../../types";

const ICONS: Record<string, LucideIcon> = {
  FileText,
  ListChecks,
  Users,
  ClipboardList,
  Banknote,
  CalendarClock,
  PackageCheck,
  CreditCard,
  Lock,
  Ban,
  Gavel,
  Tags,
  Sparkles,
  HelpCircle,
  Lightbulb,
};

const CONFIDENCE_STYLES: Record<string, { label: string; color: string }> = {
  high: { label: "High confidence", color: "var(--color-emerald)" },
  medium: { label: "Medium confidence", color: "var(--color-amber)" },
  low: { label: "Low confidence", color: "#f26666" },
  unknown: { label: "Unverified", color: "var(--color-text-faint)" },
};

interface InsightCardProps {
  section: InsightSection;
  sources: SourceChunk[];
  confidence: "high" | "medium" | "low" | "unknown";
  delay?: number;
}

export default function InsightCard({ section, sources, confidence, delay = 0 }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = ICONS[section.icon] ?? FileText;

  const isEmpty = Array.isArray(section.content) ? section.content.length === 0 : !section.content.trim();
  const items = Array.isArray(section.content) ? section.content : [section.content];
  const visibleItems = expanded ? items : items.slice(0, 3);
  const hasMore = items.length > visibleItems.length;

  const textToCopy = items.join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const confStyle = CONFIDENCE_STYLES[confidence];

  return (
    <GlassCard className="flex h-full flex-col p-5" delay={delay} hoverable>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--color-accent-soft)" }}
          >
            <Icon className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
          </div>
          <h3 className="font-display text-base">{section.title}</h3>
        </div>
        {!isEmpty && (
          <button
            onClick={handleCopy}
            className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
            aria-label={`Copy ${section.title}`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {isEmpty ? (
        <p className="text-xs text-[var(--color-text-faint)]">Not found in the retrieved context.</p>
      ) : (
        <div className="flex-1 space-y-1.5 text-sm text-[var(--color-text-muted)]">
          {visibleItems.map((item, i) =>
            items.length > 1 || Array.isArray(section.content) ? (
              <div key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--color-accent)" }} />
                <span>{item}</span>
              </div>
            ) : (
              <p key={i} className="leading-relaxed">
                {item}
              </p>
            )
          )}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 flex items-center gap-1 self-start text-xs"
          style={{ color: "var(--color-accent)" }}
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown className="h-3 w-3" />
          </motion.span>
          {expanded ? "Show less" : `Show ${items.length - 3} more`}
        </button>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
        <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: confStyle.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: confStyle.color }} />
          {confStyle.label}
        </span>
        {sources.length > 0 && (
          <span
            title={sources.map((s) => `${s.document_name} · chunk ${s.chunk_index}`).join("\n")}
            className="rounded-full border px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-faint)]"
            style={{ borderColor: "var(--color-border)" }}
          >
            {sources.length} excerpt{sources.length !== 1 ? "s" : ""} cited
          </span>
        )}
      </div>
    </GlassCard>
  );
}
