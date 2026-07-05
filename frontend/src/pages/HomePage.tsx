import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Scale,
  BookOpen,
  XCircle,
  CheckCircle2,
  Target,
  ListChecks,
  Search,
  FileCheck,
  ShieldCheck,
  ClipboardList,
  TrendingUp,
  Sparkles,
  ChevronDown,
  UploadCloud,
  Network,
  BrainCircuit,
} from "lucide-react";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import ParticleField from "../components/ui/ParticleField";
import AnimatedCounter from "../components/ui/AnimatedCounter";

const MOTIVATION_POINTS = [
  "Legal professionals spend significant time on document review, case research, and compliance verification.",
  "Increasing volumes of legal documents make manual processing slow, expensive, and difficult to manage.",
  "Traditional legal automation tools lack advanced reasoning, contextual understanding, and decision-making capabilities.",
  "Manual legal workflows are often time-consuming, inconsistent, and prone to human error.",
];

const OBJECTIVES = [
  "Build an Agentic AI framework for legal reasoning and workflow automation.",
  "Use Large Language Models and NLP to analyze legal documents and user queries.",
  "Coordinate multiple AI agents for research, contract review, and compliance verification.",
  "Automate document processing, retrieval, and report generation.",
  "Provide intelligent decision support while reducing operational costs.",
  "Deliver it through a real, usable web interface — not just a research prototype.",
];

const AGENTS = [
  { icon: UploadCloud, title: "Ingestion", body: "Documents are cleaned, chunked, and embedded into a searchable vector index." },
  { icon: Search, title: "Research agent", body: "Retrieves the most relevant clauses and context for a given question." },
  { icon: FileCheck, title: "Contract review", body: "Reads agreements for obligations, parties, dates, and payment terms." },
  { icon: ShieldCheck, title: "Compliance & risk", body: "Flags one-sided terms, liability gaps, and missing protections." },
  { icon: ClipboardList, title: "Report generation", body: "Synthesizes findings into structured, citable insights." },
];

const RESULTS = [
  { value: 85, suffix: "%", label: "Target improvement in document processing efficiency" },
  { value: 42.6, suffix: "%", label: "Target reduction in operational costs" },
  { value: 60, suffix: "%", label: "Target faster document & case-law retrieval" },
  { value: 91, suffix: "–99%", label: "Target accuracy in legal reasoning tasks" },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5, delay, ease: "easeOut" as const },
  };
}

export default function HomePage() {
  const [showFullIntro, setShowFullIntro] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
          <span className="font-display text-lg tracking-tight">LegalGPT</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link to="/dashboard">
            <Button variant="secondary" size="sm">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-14 text-center">
        <ParticleField />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span
            className="mb-6 inline-block rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-widest"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
          >
            An Agentic AI framework for legal work
          </span>
          <h1 className="font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl">
            Intelligent legal reasoning,
            <br />
            <span style={{ color: "var(--color-accent)" }}>workflow automation, and cost optimization.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-text-muted)]">
            LegalGPT reads, retrieves, and reasons over your legal documents — turning hours of
            manual review into a grounded conversation with citations back to the source.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#about">
              <Button variant="ghost" size="lg">
                Learn how it works <ChevronDown className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Introduction */}
      <section id="about" className="mx-auto max-w-4xl px-6 pb-20 scroll-mt-10">
        <motion.div {...fadeUp()}>
          <GlassCard className="p-8" animate={false}>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
              <h2 className="font-display text-2xl">Introduction</h2>
            </div>
            <p className="leading-relaxed text-[var(--color-text-muted)]">
              The legal industry generates large volumes of documents and requires extensive
              research, review, and compliance verification. Traditional legal processes are
              often time-consuming, costly, and dependent on manual effort.{" "}
              {showFullIntro && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Recent advancements in Artificial Intelligence, Large Language Models, and
                  Natural Language Processing enable intelligent automation of legal tasks.
                  LegalGPT is an Agentic AI framework that assists legal professionals by
                  analyzing legal documents, retrieving relevant information, and supporting
                  decision-making. It automates repetitive workflows, improves operational
                  efficiency, reduces processing time, and helps optimize legal service costs —
                  aiming to be a scalable, intelligent, and cost-effective solution for modern
                  legal operations.
                </motion.span>
              )}
            </p>
            <button
              onClick={() => setShowFullIntro((s) => !s)}
              className="mt-3 flex items-center gap-1 text-sm"
              style={{ color: "var(--color-accent)" }}
            >
              {showFullIntro ? "Show less" : "Read more"}
              <motion.span animate={{ rotate: showFullIntro ? 180 : 0 }}>
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </button>
          </GlassCard>
        </motion.div>
      </section>

      {/* Existing vs Proposed */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <motion.h2 {...fadeUp()} className="mb-10 text-center font-display text-3xl">
          Why not just keep doing it manually?
        </motion.h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div {...fadeUp()}>
            <GlassCard className="h-full p-6" animate={false}>
              <div className="mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                <h3 className="font-display text-lg">The existing approach</h3>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                Legal work is handled through manual document review, research, and compliance
                checks. Rule-based automation tools are limited to predefined tasks and struggle
                with complex legal reasoning — leaving workflows costly, slow, and inconsistent.
              </p>
            </GlassCard>
          </motion.div>
          <motion.div {...fadeUp(0.1)}>
            <GlassCard className="h-full p-6" hoverable animate={false}>
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: "var(--color-emerald)" }} />
                <h3 className="font-display text-lg">The LegalGPT approach</h3>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                An Agentic AI system that combines LLMs and NLP with a multi-agent pipeline —
                retrieval, contract review, compliance, and reporting — to reason over real
                documents and answer with grounded, citable evidence.
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Motivation */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <motion.div {...fadeUp()} className="mb-8 flex items-center justify-center gap-2">
          <Target className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
          <h2 className="font-display text-3xl">Motivation</h2>
        </motion.div>
        <div className="space-y-3">
          {MOTIVATION_POINTS.map((point, i) => (
            <motion.div key={point} {...fadeUp(i * 0.08)}>
              <GlassCard className="flex items-start gap-3 p-4" animate={false}>
                <span
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px]"
                  style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-strong)" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{point}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Objectives */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <motion.div {...fadeUp()} className="mb-8 flex items-center justify-center gap-2">
          <ListChecks className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
          <h2 className="font-display text-3xl">Objectives</h2>
        </motion.div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {OBJECTIVES.map((obj, i) => (
            <motion.div key={obj} {...fadeUp(i * 0.06)}>
              <GlassCard className="flex items-start gap-3 p-4" hoverable animate={false}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--color-emerald)" }} />
                <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{obj}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Architecture / How it works */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <motion.div {...fadeUp()} className="mb-10 flex flex-col items-center text-center">
          <div className="mb-2 flex items-center gap-2">
            <Network className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
            <h2 className="font-display text-3xl">A multi-agent pipeline</h2>
          </div>
          <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
            Rather than one model doing everything, LegalGPT coordinates focused steps —
            each responsible for one part of legal reasoning.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {AGENTS.map(({ icon: Icon, title, body }, i) => (
            <motion.div key={title} {...fadeUp(i * 0.08)} className="relative">
              <GlassCard className="h-full p-5" hoverable animate={false}>
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "var(--color-accent-soft)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
                </div>
                <h3 className="font-display text-base">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]">{body}</p>
              </GlassCard>
              {i < AGENTS.length - 1 && (
                <div
                  className="absolute right-[-10%] top-9 hidden h-px w-1/5 lg:block"
                  style={{ background: "var(--color-border)" }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Expected impact */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <motion.div {...fadeUp()} className="mb-4 flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5" style={{ color: "var(--color-accent)" }} />
          <h2 className="font-display text-3xl">Targeted impact</h2>
        </motion.div>
        <motion.p {...fadeUp(0.05)} className="mx-auto mb-10 max-w-xl text-center text-sm text-[var(--color-text-faint)]">
          These are the outcomes the project was designed around, not measured production metrics.
        </motion.p>
        <motion.div {...fadeUp(0.1)} className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {RESULTS.map((r) => (
            <div key={r.label} className="text-center">
              <div className="font-display text-3xl" style={{ color: "var(--color-accent)" }}>
                <AnimatedCounter value={r.value} suffix={r.suffix} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">{r.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Conclusion / CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <motion.div {...fadeUp()}>
          <GlassCard className="flex flex-col items-center gap-6 px-8 py-16 text-center" animate={false}>
            <BrainCircuit className="h-7 w-7" style={{ color: "var(--color-accent)" }} />
            <h2 className="max-w-2xl font-display text-3xl">
              Agentic AI, applied to the paperwork nobody has time to read twice.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              LegalGPT automates repetitive legal processes and supports intelligent
              decision-making — increasing productivity, improving workflow efficiency, and
              delivering reliable, citable legal assistance.
            </p>
            <Link to="/dashboard">
              <Button size="lg">
                <Sparkles className="h-4 w-4" /> Open the Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="max-w-md text-xs text-[var(--color-text-faint)]">
              LegalGPT provides informational analysis only and is not a substitute for advice
              from a licensed attorney.
            </p>
          </GlassCard>
        </motion.div>
      </section>

      <footer
        className="border-t px-6 py-8 text-center text-xs text-[var(--color-text-faint)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        © {new Date().getFullYear()} LegalGPT — An Agentic AI Framework for Intelligent Legal
        Reasoning, Workflow Automation and Cost Optimization.
      </footer>
    </div>
  );
}