"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { EntrySource } from "@/lib/types";
import { JournalCanvas } from "@/components/journal/journal-canvas";
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
}

function getHeading(year: number, month?: number, day?: number): string {
  if (day != null && month != null) return formatFullDate(year, month, day);
  if (month != null) return `${MONTH_NAMES[month]} ${year}`;
  return String(year);
}

export function EntryViewer({ year, month, day }: EntryViewerProps) {
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
      <JournalCanvas
        heading={getHeading(year, month, day)}
        meta={<span>Loading entry</span>}
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
      <JournalCanvas
        heading={getHeading(year, month, day)}
        meta={<span>Connection required</span>}
        body={<p className="text-sm text-muted-foreground">{error}</p>}
      />
    );
  }

  if (day == null || month == null) {
    return (
      <JournalCanvas
        heading={getHeading(year, month, day)}
        meta={<span>Archive selection</span>}
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
      <JournalCanvas
        heading={getHeading(year, month, day)}
        meta={<span>No entry yet</span>}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/journal/write?year=${year}&month=${month}&day=${day}`}>
              Write for this day
            </Link>
          </Button>
        }
        body={
          <p className="text-sm text-muted-foreground">
            Start writing for this day. The journal canvas stays in place so browsing and writing use the same layout.
          </p>
        }
      />
    );
  }

  const editableEntry = entries[0] ?? null;

  return (
    <JournalCanvas
      heading={getHeading(year, month, day)}
      meta={
        <>
          <span>{entries.length === 1 ? "Single entry" : `${entries.length} entries`}</span>
          <span className="text-border">·</span>
          <span>{entries.some((entry) => entry.images?.length) ? "Includes images" : "Text only"}</span>
        </>
      }
      body={
        <div className="animate-page space-y-8">
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
      footer={
        <div className="flex items-center justify-between gap-3">
          <span>{editableEntry?.source === "web" ? "Web entry" : "Imported entry"}</span>
          <span>
            {entries.reduce((sum, entry) => sum + entry.content.split(/\s+/).filter(Boolean).length, 0)} words
          </span>
        </div>
      }
    />
  );
}
