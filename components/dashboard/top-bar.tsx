"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Pen, Settings } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface JournalEntry {
  id: string;
  content?: string;
  encrypted_content?: string;
}

export function TopBar() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/entries?year=${year}&month=${month}&day=${day}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: JournalEntry[]) => {
        if (!cancelled) setEntry(data[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setEntry(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, month, day]);

  const content = entry?.content ?? entry?.encrypted_content ?? "";
  const wordCount = content
    ? content.split(/\s+/).filter(Boolean).length
    : 0;

  const writeHref = `/journal/write?year=${year}&month=${month}&day=${day}`;
  let ctaHref: string;
  let ctaLabel: string;
  if (entry) {
    ctaHref = `/journal/write?entry=${entry.id}`;
    ctaLabel =
      isDesktop && wordCount > 0
        ? `Continue writing \u00b7 ${wordCount} words`
        : "Continue writing";
  } else {
    ctaHref = writeHref;
    ctaLabel = "Write";
  }

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-end border-b border-border bg-[var(--surface-topbar)] px-4">
      <div className="flex items-center gap-2">
        {!loading && (
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--journal)] px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <Pen className="h-3 w-3" />
            {ctaLabel}
          </Link>
        )}
        <Link
          href="/journal/browse"
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Journal calendar"
        >
          <Calendar className="h-4 w-4" />
        </Link>
        <Link
          href="/settings"
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
