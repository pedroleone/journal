"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { EntrySource } from "@/lib/types";
import { JournalEntryState } from "@/components/journal/journal-entry-state";

interface Entry {
  id: string;
  source: EntrySource;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  content: string;
  created_at: string;
  images: string[] | null;
}

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatFullDate(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return `${DAY_NAMES[date.getDay()]}, ${day} ${MONTH_NAMES[month]} ${year}`;
}

interface EntryViewerProps {
  year: number;
  month?: number;
  day?: number;
  actions?: React.ReactNode;
}

function getHeading(year: number, month?: number, day?: number): string {
  if (day != null && month != null) return formatFullDate(year, month, day);
  if (month != null) return `${MONTH_NAMES[month]} ${year}`;
  return String(year);
}

function FlatJournalView({
  heading,
  actions,
  body,
}: {
  heading: string;
  actions?: React.ReactNode;
  body: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-[760px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="font-display text-[2rem] leading-tight tracking-tight text-foreground sm:text-[2.25rem]">
          {heading}
        </h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-7">{body}</div>
    </section>
  );
}

export function EntryViewer({ year, month, day, actions }: EntryViewerProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isOnline) {
      setError("Reconnect to load entries for this date");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ year: String(year) });
      if (month != null) params.set("month", String(month));
      if (day != null) params.set("day", String(day));
      const res = await fetch(`/api/entries?${params}`);
      if (!res.ok) throw new Error("Failed to fetch entries");

      const raw: Entry[] = await res.json();
      setEntries(raw);
    } catch {
      setError("Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [day, isOnline, month, year]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  if (loading) {
    return (
      <FlatJournalView
        heading={getHeading(year, month, day)}
        actions={actions}
        body={
          <div className="animate-page space-y-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        }
      />
    );
  }

  if (error) {
    return (
      <FlatJournalView
        heading={getHeading(year, month, day)}
        actions={actions}
        body={<p className="text-sm text-muted-foreground">{error}</p>}
      />
    );
  }

  if (day == null || month == null) {
    return (
      <FlatJournalView
        heading={getHeading(year, month, day)}
        actions={actions}
        body={
          <p className="text-sm text-muted-foreground">
            Pick a specific day from the archive to read or edit an entry.
          </p>
        }
      />
    );
  }

  if (entries.length === 0) {
    return (
      <FlatJournalView
        heading={getHeading(year, month, day)}
        actions={
          <div className="flex items-center gap-3">
            {actions}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/journal/write?year=${year}&month=${month}&day=${day}`}>
                Write for this day
              </Link>
            </Button>
          </div>
        }
        body={
          <p className="text-sm text-muted-foreground">
            Start writing for this day. The journal canvas stays in place so browsing and writing use the same layout.
          </p>
        }
      />
    );
  }

  return (
    <FlatJournalView
      heading={getHeading(year, month, day)}
      actions={actions}
      body={
        <div className="journal-browse-reading animate-page space-y-6">
          {entries.map((entry) => (
            <JournalEntryState
              key={entry.id}
              entryId={entry.id}
              content={entry.content}
              imageKeys={entry.images}
              editable={entry.source === "web"}
            />
          ))}
        </div>
      }
    />
  );
}
