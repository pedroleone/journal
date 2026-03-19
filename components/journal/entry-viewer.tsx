"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EncryptedImageGallery } from "@/components/encrypted-image-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { EntrySource } from "@/lib/types";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

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

const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatFullDate(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return `${DAY_NAMES[date.getDay()]}, ${day} ${MONTH_NAMES[month]} ${year}`;
}

function formatShortDate(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return `${SHORT_DAY_NAMES[date.getDay()]}, ${day} ${MONTH_NAMES[month]}`;
}

function formatTime(hour: number | null, createdAt: string): string {
  if (hour !== null) {
    return `${String(hour).padStart(2, "0")}:00`;
  }
  const d = new Date(createdAt);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
      <div className="animate-page space-y-6 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No entries for this date</p>
      </div>
    );
  }

  const isDayView = day != null;
  const editableEntry = isDayView ? entries[0] ?? null : null;

  // For month/year views, group entries by day
  if (!isDayView) {
    const dayGroups = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = `${entry.year}-${entry.month}-${entry.day}`;
      if (!dayGroups.has(key)) dayGroups.set(key, []);
      dayGroups.get(key)!.push(entry);
    }
    const sortedKeys = [...dayGroups.keys()].sort();

    return (
      <div className="animate-page p-8 max-w-3xl mx-auto">
        <h2 className="font-display text-2xl tracking-tight">
          {getHeading(year, month, day)}
        </h2>
        <div className="mt-8 space-y-10">
          {sortedKeys.map((key) => {
            const dayEntries = dayGroups.get(key)!;
            const first = dayEntries[0];
            return (
              <div key={key}>
                <p className="mb-4 text-sm font-medium text-muted-foreground border-b border-border/40 pb-1">
                  {formatShortDate(first.year, first.month, first.day)}
                </p>
                <div className="space-y-8">
                  {dayEntries.map((entry, i) => (
                    <div key={entry.id}>
                      {dayEntries.length > 1 && (
                        <p className="mb-2 text-xs text-muted-foreground">
                          {formatTime(entry.hour, entry.created_at)}
                        </p>
                      )}
                      {entry.images?.length ? (
                        <div className="flex flex-col md:flex-row md:gap-8 md:items-start">
                          <div className="order-2 md:order-1 md:w-20 md:shrink-0 mt-4 md:mt-0">
                            <EncryptedImageGallery imageKeys={entry.images} />
                          </div>
                          <div className="order-1 md:order-2 flex-1 min-w-0">
                            <MarkdownEditor readOnly value={entry.content} className="text-base leading-relaxed" />
                          </div>
                        </div>
                      ) : (
                        <MarkdownEditor readOnly value={entry.content} className="text-base leading-relaxed" />
                      )}
                      {i < dayEntries.length - 1 && (
                        <div className="mt-8 border-b border-border/40" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <h2 className="font-display text-2xl tracking-tight">
          {getHeading(year, month, day)}
        </h2>
        {editableEntry ? (
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <Link href={`/journal/write?entry=${editableEntry.id}`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-8 space-y-8">
        {entries.map((entry, i) => (
          <div key={entry.id}>
            {entries.length > 1 && (
              <p className="mb-2 text-xs text-muted-foreground">
                {formatTime(entry.hour, entry.created_at)}
              </p>
            )}
            {entry.images?.length ? (
              <div className="flex flex-col md:flex-row md:gap-8 md:items-start">
                <div className="order-2 md:order-1 md:w-20 md:shrink-0 mt-4 md:mt-0">
                  <EncryptedImageGallery imageKeys={entry.images} />
                </div>
                <div className="order-1 md:order-2 flex-1 min-w-0">
                  {entry.source === "web" ? (
                    <Link href={`/journal/write?entry=${entry.id}`} className="block rounded-md -mx-2 px-2 py-1 transition-colors hover:bg-secondary/50">
                      <MarkdownEditor readOnly value={entry.content} className="text-base leading-relaxed pointer-events-none" />
                    </Link>
                  ) : (
                    <MarkdownEditor readOnly value={entry.content} className="text-base leading-relaxed" />
                  )}
                </div>
              </div>
            ) : (
              entry.source === "web" ? (
                <Link href={`/journal/write?entry=${entry.id}`} className="block rounded-md -mx-2 px-2 py-1 transition-colors hover:bg-secondary/50">
                  <MarkdownEditor readOnly value={entry.content} className="text-base leading-relaxed pointer-events-none" />
                </Link>
              ) : (
                <MarkdownEditor readOnly value={entry.content} className="text-base leading-relaxed" />
              )
            )}
            {i < entries.length - 1 && (
              <div className="mt-8 border-b border-border/40" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
