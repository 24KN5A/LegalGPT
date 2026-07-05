import { CircleUser } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import GlassCard from "../components/ui/GlassCard";

export default function ProfilePage() {
  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-2xl">
        <GlassCard className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]">
            <CircleUser className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl">Single-workspace mode</h2>
          <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
            LegalGPT is currently running without user accounts — every document and conversation
            in this workspace is shared across anyone with API access. Multi-user accounts,
            authentication, and per-user document isolation are on the roadmap; they'll appear
            here once the backend exposes an auth API.
          </p>
        </GlassCard>
      </div>
    </AppShell>
  );
}
