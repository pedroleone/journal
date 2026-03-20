"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Mode } from "@/lib/mode-context";
import { AccentDot } from "./accent-dot";

interface QuadrantCardProps {
  domain: Mode;
  label: string;
  href: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function QuadrantCard({
  domain,
  label,
  href,
  actions,
  footer,
  children,
}: QuadrantCardProps) {
  return (
    <div className="flex flex-col bg-background p-4 transition-colors hover:bg-accent/30 dark:bg-[var(--bg-quad)] dark:hover:bg-[var(--bg-surface)]">
      <div className="mb-3 flex items-center justify-between">
        <Link href={href} className="flex items-center gap-2">
          <AccentDot domain={domain} />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </Link>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <Link href={href} className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">{children}</div>
        {footer && (
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            {footer}
          </div>
        )}
      </Link>
    </div>
  );
}
