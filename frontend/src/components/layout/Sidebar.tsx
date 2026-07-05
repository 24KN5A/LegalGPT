import { NavLink } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  UploadCloud,
  Library,
  MessageSquare,
  ShieldAlert,
  Settings,
  Scale,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: UploadCloud },
  { to: "/library", label: "Document Library", icon: Library },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/analysis", label: "Risk Analysis", icon: ShieldAlert },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/5 bg-[var(--color-bg-elevated)]/60 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-6 py-6">
        <Scale className="h-5 w-5 text-[var(--color-accent)]" />
        <span className="font-display text-lg tracking-tight">LegalGPT</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                  : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                : "text-[var(--color-text-muted)] hover:bg-white/5 hover:text-[var(--color-text)]"
            )
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
