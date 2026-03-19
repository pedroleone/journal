"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pen } from "lucide-react";
import { QuadrantCard } from "./quadrant-card";

interface JournalEntry {
  id: string;
  encrypted_content: string;
  images: string[] | null;
}

interface JournalQuadrantProps {
  date: Date;
}

export function JournalQuadrant({ date }: JournalQuadrantProps) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    fetch(`/api/entries?year=${y}&month=${m}&day=${d}`)
      .then((r) => r.json())
      .then((data: JournalEntry[]) => {
        setEntry(data[0] ?? null);
      })
      .catch(() => setEntry(null))
      .finally(() => setLoading(false));
  }, [date]);

  const content = entry?.encrypted_content ?? "";
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const imageCount = entry?.images?.length ?? 0;

  return (
    <QuadrantCard
      domain="journal"
      label="Journal"
      href="/journal/browse"
      actions={
        <Link
          href="/journal/write"
          className="rounded bg-[var(--journal-dim)] px-2 py-0.5 text-xs font-medium text-[var(--journal)] hover:bg-[var(--journal)]/25"
          onClick={(e) => e.stopPropagation()}
        >
          <Pen className="mr-1 inline-block h-3 w-3" />
          Write
        </Link>
      }
      footer={
        entry ? (
          <>
            <span>{wordCount} words</span>
            {imageCount > 0 && <span>{imageCount} images</span>}
          </>
        ) : null
      }
    >
      {loading ? (
        <div className="h-20 animate-pulse rounded bg-muted/30" />
      ) : entry ? (
        <p className="line-clamp-5 text-sm leading-relaxed text-foreground/80">
          {content}
        </p>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No entry yet
        </p>
      )}
    </QuadrantCard>
  );
}
