import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
}

export default function GlassCard({ children, className, hoverable = false, ...rest }: GlassCardProps) {
  return (
    <div
      className={clsx(
        "glass rounded-2xl",
        hoverable && "glass-hover",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
