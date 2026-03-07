"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { decrypt } from "@/lib/crypto";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getKey } from "@/lib/key-manager";

interface RawEntry {
  id: string;
  type: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  encrypted_content: string;
  iv: string;
  created_at: string;
}

interface DecryptedEntry {
  id: string;
  content: string;
  hour: number | null;
  created_at: string;
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

function formatTime(hour: number | null, createdAt: string): string {
  if (hour !== null) {
    return `${String(hour).padStart(2, "0")}:00`;
  }
  const d = new Date(createdAt);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface EntryViewerProps {
  year: number;
  month: number;
  day: number;
}

export function EntryViewer({ year, month, day }: EntryViewerProps) {
  const [entries, setEntries] = useState<DecryptedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const loadAndDecrypt = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isOnline) {
      setError("Reconnect to load entries for this date");
      setLoading(false);
      return;
    }

    const key = getKey();
    if (!key) {
      setError("No encryption key available");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
        day: String(day),
      });
      const res = await fetch(`/api/journal?${params}`);
      if (!res.ok) throw new Error("Failed to fetch entries");

      const raw: RawEntry[] = await res.json();
      const decrypted: DecryptedEntry[] = [];

      for (const entry of raw) {
        try {
          const content = await decrypt(key, entry.encrypted_content, entry.iv);
          decrypted.push({
            id: entry.id,
            content,
            hour: entry.hour,
            created_at: entry.created_at,
          });
        } catch {
          decrypted.push({
            id: entry.id,
            content: "[decryption failed]",
            hour: entry.hour,
            created_at: entry.created_at,
          });
        }
      }

      setEntries(decrypted);
    } catch {
      setError("Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [day, isOnline, month, year]);

  useEffect(() => {
    loadAndDecrypt();
  }, [loadAndDecrypt]);

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

  return (
    <div className="animate-page p-8 max-w-2xl">
      <div className="flex items-start justify-between">
        <h2 className="font-display text-2xl tracking-tight">
          {formatFullDate(year, month, day)}
        </h2>
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link
            href={`/journal/write?entry=${entries[0].id}`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="mt-8 space-y-8">
        {entries.map((entry, i) => (
          <div key={entry.id}>
            {entries.length > 1 && (
              <p className="mb-2 text-xs text-muted-foreground">
                {formatTime(entry.hour, entry.created_at)}
              </p>
            )}
            <div className="whitespace-pre-wrap text-base leading-relaxed">
              {entry.content}
            </div>
            {i < entries.length - 1 && (
              <div className="mt-8 border-b border-border/40" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
