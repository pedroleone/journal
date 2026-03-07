"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Loader2, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getKey } from "@/lib/key-manager";
import { decrypt } from "@/lib/crypto";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useRequireUnlock } from "@/hooks/use-require-unlock";

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

function formatWriteDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth() + 1]} ${date.getFullYear()}`;
}

export default function WritePage() {
  const searchParams = useSearchParams();
  const editEntryId = searchParams.get("entry");

  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date());
  const [loadedEntryId, setLoadedEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [readyForEditing, setReadyForEditing] = useState(false);
  const hasKey = useRequireUnlock();
  const isOnline = useOnlineStatus();

  const loadEntry = useCallback(
    async (id: string) => {
      const key = getKey();
      if (!key) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/entries/${id}`);
        if (!res.ok) return;
        const entry = await res.json();
        const text = await decrypt(key, entry.encrypted_content, entry.iv);
        setContent(text);
        setDate(new Date(entry.year, entry.month - 1, entry.day));
        setLoadedEntryId(id);
      } catch {
        // Failed to load entry
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadEntryForDate = useCallback(
    async (targetDate: Date) => {
      const key = getKey();
      if (!key) return;

      const params = new URLSearchParams({
        year: String(targetDate.getFullYear()),
        month: String(targetDate.getMonth() + 1),
        day: String(targetDate.getDate()),
      });

      try {
        const res = await fetch(`/api/entries?${params}`);
        if (!res.ok) return;
        const entries = await res.json();
        if (entries.length > 0) {
          const entry = entries[0];
          const text = await decrypt(key, entry.encrypted_content, entry.iv);
          setContent(text);
          setLoadedEntryId(entry.id);
        } else {
          setContent("");
          setLoadedEntryId(null);
        }
      } catch {
        // Failed to load
      }
    },
    [],
  );

  useEffect(() => {
    if (!hasKey) return;
    if (!isOnline) return;
    if (editEntryId) {
      setReadyForEditing(false);
      void loadEntry(editEntryId).finally(() => {
        setReadyForEditing(true);
      });
    } else {
      setReadyForEditing(true);
      void loadEntryForDate(date);
    }
  }, [date, editEntryId, hasKey, isOnline, loadEntry, loadEntryForDate]);

  const { status } = useAutoSave({
    entryId: loadedEntryId,
    content,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

  if (!hasKey) return null;

  if (!isOnline && !readyForEditing) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center px-6">
        <div className="max-w-md space-y-2 text-center">
          <h1 className="font-display text-2xl tracking-tight">Connection required</h1>
          <p className="text-sm text-muted-foreground">
            Install keeps the app shell available offline, but loading and saving journal entries still requires a connection.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {!isOnline && (
        <div className="border-b border-border/60 bg-secondary/60 px-6 py-2 text-center text-sm text-muted-foreground">
          You are offline. Changes stay visible here but are not being saved.
        </div>
      )}
      <div className="flex items-center justify-between px-6 py-4">
        <Link
          href="/journal/browse"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button className="font-display text-lg tracking-tight text-foreground hover:text-muted-foreground transition-colors">
              {formatWriteDate(date)}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d);
                  setCalendarOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="w-16" />
      </div>

      <div className="flex-1 px-6 pb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="h-full w-full max-w-2xl mx-auto resize-none border-0 bg-transparent text-lg leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none"
          autoFocus
        />
      </div>

      <div className="flex items-center justify-between border-t border-border/40 px-6 py-3">
        <div />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {status === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </>
          )}
          {status === "saved" && (
            <>
              <Check className="h-3 w-3" />
              Saved
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="h-3 w-3" />
              Save failed
            </>
          )}
          {status === "offline" && (
            <>
              <AlertCircle className="h-3 w-3" />
              Offline
            </>
          )}
        </div>
      </div>
    </div>
  );
}
