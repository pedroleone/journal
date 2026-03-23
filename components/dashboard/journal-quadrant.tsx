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
  updated_at?: string;
}

interface JournalQuadrantProps {
  date: Date;
}

interface JournalSnapshot {
  requestKey: string;
  entry: JournalEntry | null;
}

interface LatestJournalDate {
  year: number;
  month: number;
  day: number;
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function formatUpdatedLabel(value: string): string {
  const date = new Date(value);
  return `Last updated ${date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function buildDateFromParts(value: LatestJournalDate): Date {
  return new Date(value.year, value.month - 1, value.day);
}

export function JournalQuadrant({ date }: JournalQuadrantProps) {
  const [snapshot, setSnapshot] = useState<JournalSnapshot | null>(null);
  const [latestDate, setLatestDate] = useState<LatestJournalDate | null | undefined>(undefined);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const requestKey = `${year}-${month}-${day}`;
  const browseHref = `/journal/browse?date=${date.toISOString().slice(0, 10)}`;
  const writeHref = `/journal/write?year=${year}&month=${month}&day=${day}`;
  const isToday = isSameCalendarDay(date, new Date());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/entries?year=${year}&month=${month}&day=${day}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
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

  useEffect(() => {
    if (!isToday) {
      setLatestDate(undefined);
      return;
    }

    if (snapshot?.requestKey !== requestKey) return;
    if (snapshot.entry) {
      setLatestDate(undefined);
      return;
    }

    let cancelled = false;
    fetch("/api/entries/dates")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: LatestJournalDate[]) => {
        if (cancelled) return;
        setLatestDate(data[0] ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setLatestDate(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isToday, requestKey, snapshot]);

  const entry = snapshot?.requestKey === requestKey ? snapshot.entry : null;
  const loading = snapshot?.requestKey !== requestKey;

  const content = entry?.content ?? entry?.encrypted_content ?? "";
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const latestAgeLabel = latestDate
    ? `${Math.round((date.getTime() - buildDateFromParts(latestDate).getTime()) / 86_400_000)} days ago`
    : latestDate === null
      ? "Empty journal"
      : null;
  const primaryHref = isToday
    ? (entry ? `/journal/write?entry=${entry.id}` : writeHref)
    : browseHref;

  return (
    <QuadrantCard
      domain="journal"
      label="Journal"
      href={primaryHref}
      actions={
        <>
          <Link
            href={browseHref}
            className="rounded bg-[var(--journal-dim)] px-2 py-0.5 text-xs font-medium text-[var(--journal)] hover:bg-[var(--journal)]/25"
          >
            <BookOpen className="mr-1 inline-block h-3 w-3" />
            Browse Entries
          </Link>
          {isToday ? (
            <Link
              href={entry ? `/journal/write?entry=${entry.id}` : writeHref}
              className="rounded bg-[var(--journal-dim)] px-2 py-0.5 text-xs font-medium text-[var(--journal)] hover:bg-[var(--journal)]/25"
            >
              <Pen className="mr-1 inline-block h-3 w-3" />
              {entry ? "Continue Writing" : "Write"}
            </Link>
          ) : null}
        </>
      }
      footer={
        loading ? null : entry && isToday ? (
          <>
            {entry.updated_at ? <span>{formatUpdatedLabel(entry.updated_at)}</span> : null}
            <span>{wordCount} words</span>
          </>
        ) : isToday && latestAgeLabel ? (
          <span>{latestAgeLabel}</span>
        ) : null
      }
    >
      {loading ? (
        <div className="h-20 animate-pulse rounded bg-muted/30" />
      ) : entry && isToday ? (
        <div className="flex min-h-20 items-center justify-center py-4">
          <Link
            href={`/journal/write?entry=${entry.id}`}
            className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-[var(--journal)] px-6 py-3 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Continue Writing
          </Link>
        </div>
      ) : isToday ? (
        <div className="flex min-h-20 items-center justify-center py-4">
          <Link
            href={writeHref}
            className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-[var(--journal)] px-8 py-3 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Write
          </Link>
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {entry ? "Entry available" : "No entry for this day"}
        </p>
      )}
    </QuadrantCard>
  );
}
