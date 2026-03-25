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
    <div className="flex flex-col bg-[var(--surface-panel)] p-4 transition-colors hover:bg-[var(--surface-panel-hover)]">
      <div className="mb-3 flex items-center justify-between">
        <Link href={href} className="flex items-center gap-2">
          <AccentDot domain={domain} />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </Link>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Link
          href={href}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 rounded-md pointer-events-none"
        />
        <div className="relative z-10 flex-1 overflow-hidden">
          {children}
        </div>
        {footer && (
          <div className="relative z-10 mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
