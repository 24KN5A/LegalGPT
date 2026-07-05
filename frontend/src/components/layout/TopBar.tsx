import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CircleUser } from "lucide-react";
import { getHealth } from "../../lib/api";
import type { HealthStatus } from "../../types";

export default function TopBar({ title }: { title: string }) {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    getHealth()
      .then((h) => mounted && setHealth(h))
      .catch(() => mounted && setHealth(null));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-8">
      <h1 className="font-display text-xl">{title}</h1>

      <div className="flex items-center gap-4">
        {health && (
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-[var(--color-text-muted)] sm:flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                health.vector_store_ready ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            {health.llm_provider} · {health.embedding_provider}
          </span>
        )}
        <Link
          to="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          aria-label="Profile"
        >
          <CircleUser className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
