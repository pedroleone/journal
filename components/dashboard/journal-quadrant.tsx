"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Pen } from "lucide-react";
import { QuadrantCard } from "./quadrant-card";

interface JournalEntry {
  id: string;
  content?: string;
  encrypted_content?: string;
  images: string[] | null;
}

interface JournalQuadrantProps {
  date: Date;
}

interface JournalSnapshot {
  requestKey: string;
  entry: JournalEntry | null;
}

export function JournalQuadrant({ date }: JournalQuadrantProps) {
  const [snapshot, setSnapshot] = useState<JournalSnapshot | null>(null);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const requestKey = `${year}-${month}-${day}`;
  const browseHref = `/journal/browse?date=${date.toISOString().slice(0, 10)}`;
  const writeHref = `/journal/write?year=${year}&month=${month}&day=${day}`;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/entries?year=${year}&month=${month}&day=${day}`)
      .then((r) => r.json())
      .then((data: JournalEntry[]) => {
        if (cancelled) return;
        setSnapshot({ requestKey, entry: data[0] ?? null });
      })
      .catch(() => {
        if (cancelled) return;
        setSnapshot({ requestKey, entry: null });
      });

    return () => {
      cancelled = true;
    };
  }, [day, month, requestKey, year]);

  const entry = snapshot?.requestKey === requestKey ? snapshot.entry : null;
  const loading = snapshot?.requestKey !== requestKey;

  const content = entry?.content ?? entry?.encrypted_content ?? "";
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const imageCount = entry?.images?.length ?? 0;

  return (
    <QuadrantCard
      domain="journal"
      label="Journal"
      href={entry ? browseHref : writeHref}
      actions={
        <>
          <Link
            href={browseHref}
            className="rounded bg-[var(--journal-dim)] px-2 py-0.5 text-xs font-medium text-[var(--journal)] hover:bg-[var(--journal)]/25"
          >
            <BookOpen className="mr-1 inline-block h-3 w-3" />
            Browse
          </Link>
          <Link
            href={writeHref}
            className="rounded bg-[var(--journal-dim)] px-2 py-0.5 text-xs font-medium text-[var(--journal)] hover:bg-[var(--journal)]/25"
          >
            <Pen className="mr-1 inline-block h-3 w-3" />
            Write
          </Link>
        </>
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
