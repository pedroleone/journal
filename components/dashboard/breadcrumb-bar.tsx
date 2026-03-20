"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useBreadcrumbActions } from "./breadcrumb-actions";
import type { Mode } from "@/lib/mode-context";
import { useMediaQuery } from "@/hooks/use-media-query";

const ACCENT_TEXT: Record<Mode | "settings", string> = {
  journal: "text-[var(--journal)]",
  food: "text-[var(--food)]",
  notes: "text-[var(--notes)]",
  library: "text-[var(--library)]",
  settings: "text-muted-foreground",
};

const LABELS: Record<Mode | "settings", string> = {
  journal: "Journal",
  food: "Food",
  notes: "Notes",
  library: "Library",
  settings: "Settings",
};

interface BreadcrumbBarProps {
  domain: Mode | "settings";
  date?: Date;
}

export function BreadcrumbBar({ domain, date }: BreadcrumbBarProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const actions = useBreadcrumbActions();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-4 dark:bg-[var(--bg-topbar)]">
      <Link
        href="/"
        className={`flex items-center gap-1 text-sm font-medium ${ACCENT_TEXT[domain]} hover:opacity-80`}
      >
        <ChevronLeft className="h-4 w-4" />
        Dashboard
      </Link>
      <span className="text-muted-foreground">/</span>
      <span className="text-sm font-medium">{LABELS[domain]}</span>
      {isDesktop && date && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </>
      )}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
