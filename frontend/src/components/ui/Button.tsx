import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200",
        "focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        variant === "primary" &&
          "bg-[var(--color-accent)] text-[#161208] hover:bg-[var(--color-accent-strong)] shadow-[0_0_0_1px_rgba(201,163,95,0.3),0_8px_24px_-8px_rgba(201,163,95,0.5)]",
        variant === "secondary" &&
          "glass glass-hover text-[var(--color-text)] hover:text-white",
        variant === "ghost" &&
          "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5",
        variant === "danger" &&
          "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
