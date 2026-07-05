import { Link } from "react-router-dom";
import { ArrowRight, Scale, ShieldCheck, MessagesSquare, FileSearch } from "lucide-react";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { RiskBadge } from "../components/ui/Badge";

const CLAUSE_DEMO = [
  {
    text: "Either party may terminate this Agreement for convenience upon 30 days' written notice.",
    risk: "medium" as const,
    note: "No cure period for the counterparty",
  },
  {
    text: "Vendor's total liability shall not exceed the fees paid in the preceding twelve (12) months.",
    risk: "high" as const,
    note: "Caps liability well below typical damages",
  },
  {
    text: "This Agreement shall be governed by the laws of the State of Delaware.",
    risk: "low" as const,
    note: "Standard governing law clause",
  },
];

const FEATURES = [
  {
    icon: FileSearch,
    title: "Ask your documents anything",
    body: "Upload contracts, NDAs, or filings and get grounded answers with citations back to the exact clause — never a guess.",
  },
  {
    icon: ShieldCheck,
    title: "Automatic risk analysis",
    body: "Every upload is scanned for one-sided terms, liability gaps, and missing protections, ranked by severity.",
  },
  {
    icon: MessagesSquare,
    title: "A conversation, not a search bar",
    body: "Follow up, compare clauses across documents, and keep context across an entire negotiation.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-[var(--color-accent)]" />
          <span className="font-display text-lg tracking-tight">LegalGPT</span>
        </div>
        <Link to="/dashboard">
          <Button variant="secondary" size="sm">
            Open app
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-12 lg:grid-cols-2 lg:pt-20">
        <div>
          <span className="mb-6 inline-block rounded-full border border-white/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
            Retrieval-grounded legal AI
          </span>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-[var(--color-text)] lg:text-6xl">
            Read the fine print
            <br />
            <span className="text-[var(--color-accent)]">before it reads you.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-[var(--color-text-muted)]">
            LegalGPT retrieves the exact clauses that answer your question and flags the ones
            working against you — with citations, not guesses.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link to="/upload">
              <Button size="lg">
                Analyze a document <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="lg">
                View dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Signature element: live clause annotation card */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between font-mono text-xs text-[var(--color-text-faint)]">
            <span>vendor_agreement_final_v3.pdf</span>
            <span>p. 4 of 11</span>
          </div>
          <div className="space-y-4">
            {CLAUSE_DEMO.map((clause, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/10"
              >
                <p className="text-sm leading-relaxed text-[var(--color-text)]">
                  "{clause.text}"
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-muted)]">{clause.note}</span>
                  <RiskBadge level={clause.risk} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <GlassCard key={title} className="p-6" hoverable>
              <Icon className="mb-4 h-6 w-6 text-[var(--color-accent)]" />
              <h3 className="font-display text-lg text-[var(--color-text)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{body}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <GlassCard className="flex flex-col items-center gap-6 px-8 py-16 text-center">
          <h2 className="font-display text-3xl text-[var(--color-text)]">
            Upload your first document in under a minute.
          </h2>
          <Link to="/upload">
            <Button size="lg">
              Get started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="max-w-md text-xs text-[var(--color-text-faint)]">
            LegalGPT provides informational analysis only and is not a substitute for advice from
            a licensed attorney.
          </p>
        </GlassCard>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-[var(--color-text-faint)]">
        © {new Date().getFullYear()} LegalGPT. Not a law firm. Not legal advice.
      </footer>
    </div>
  );
}
