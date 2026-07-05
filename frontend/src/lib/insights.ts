import { sendChatMessage } from "./api";
import type { SourceChunk } from "../types";

export interface InsightSection {
  key: string;
  title: string;
  icon: string;
  content: string | string[];
}

export interface InsightsResult {
  sections: InsightSection[];
  sources: SourceChunk[];
}

const SECTION_DEFS: { key: string; title: string; icon: string; kind: "text" | "list" }[] = [
  { key: "executive_summary", title: "Executive Summary", icon: "FileText", kind: "text" },
  { key: "key_clauses", title: "Key Clauses", icon: "ListChecks", kind: "list" },
  { key: "parties", title: "Parties", icon: "Users", kind: "list" },
  { key: "responsibilities", title: "Responsibilities", icon: "ClipboardList", kind: "list" },
  { key: "financial_terms", title: "Financial Terms", icon: "Banknote", kind: "list" },
  { key: "important_dates", title: "Important Dates", icon: "CalendarClock", kind: "list" },
  { key: "deliverables", title: "Deliverables", icon: "PackageCheck", kind: "list" },
  { key: "payment_conditions", title: "Payment Conditions", icon: "CreditCard", kind: "list" },
  { key: "confidentiality", title: "Confidentiality", icon: "Lock", kind: "text" },
  { key: "termination_conditions", title: "Termination Conditions", icon: "Ban", kind: "list" },
  { key: "governing_law", title: "Governing Law", icon: "Gavel", kind: "text" },
  { key: "keywords", title: "Keywords", icon: "Tags", kind: "list" },
  { key: "ai_highlights", title: "AI Highlights", icon: "Sparkles", kind: "list" },
  { key: "suggested_questions", title: "Suggested Questions", icon: "HelpCircle", kind: "list" },
  { key: "actionable_insights", title: "Actionable Insights", icon: "Lightbulb", kind: "list" },
];

const INSIGHTS_PROMPT = `Analyze this document and respond with ONLY a single valid JSON object (no markdown fences, no commentary, no text before or after). Use exactly these keys. Every value must be grounded in the retrieved document context below -- if a section genuinely isn't present in the context, use an empty string or empty array rather than inventing content.

{
  "executive_summary": "2-4 sentence plain-English summary",
  "key_clauses": ["short description of each notable clause"],
  "parties": ["party name or role"],
  "responsibilities": ["short description of each party's responsibilities"],
  "financial_terms": ["fees, amounts, currency terms found"],
  "important_dates": ["effective date, deadlines, renewal dates, etc."],
  "deliverables": ["concrete deliverables or outputs required"],
  "payment_conditions": ["payment schedule, method, penalties for late payment"],
  "confidentiality": "1-2 sentence description of confidentiality obligations, or empty string if none",
  "termination_conditions": ["conditions under which the agreement can be terminated"],
  "governing_law": "the governing law / jurisdiction clause, or empty string if none",
  "keywords": ["8-12 key legal/business terms from the document"],
  "ai_highlights": ["2-4 notable or unusual observations a careful reader should know"],
  "suggested_questions": ["3-5 follow-up questions the user could ask a chat assistant about this document"],
  "actionable_insights": ["2-4 concrete next steps or actions the user should consider"]
}

Summarize key clauses, parties, responsibilities, financial terms, important dates, deliverables, payment conditions, confidentiality, termination, governing law, and risks.`;

function extractJson(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("The AI did not return structured data for these insights.");
  return JSON.parse(match[0]);
}

export async function generateInsights(documentId: string): Promise<InsightsResult> {
  const response = await sendChatMessage({
    message: INSIGHTS_PROMPT,
    document_id: documentId,
  });

  const parsed = extractJson(response.message.content);

  const sections: InsightSection[] = SECTION_DEFS.map((def) => {
    const raw = parsed[def.key];
    let content: string | string[];
    if (def.kind === "list") {
      content = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
    } else {
      content = typeof raw === "string" ? raw : "";
    }
    return { key: def.key, title: def.title, icon: def.icon, content };
  });

  return { sections, sources: response.message.sources };
}

export function averageConfidence(sources: SourceChunk[]): "high" | "medium" | "low" | "unknown" {
  if (sources.length === 0) return "unknown";
  const avg = sources.reduce((sum, s) => sum + (s.score ?? 0), 0) / sources.length;
  if (avg >= 0.55) return "high";
  if (avg >= 0.3) return "medium";
  return "low";
}

export const GENERATION_STAGES = [
  "Reading document...",
  "Understanding document...",
  "Searching knowledge...",
  "Generating insights...",
  "Almost done...",
];
