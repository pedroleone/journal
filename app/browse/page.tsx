"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { initActivityListeners, onLock, getKey } from "@/lib/key-manager";
import { useVisibilityLock } from "@/hooks/use-visibility-lock";
import { LockScreen } from "@/components/lock-screen";
import { PassphrasePrompt } from "@/components/passphrase-prompt";
import { EntryCard } from "@/components/entry-card";

interface Entry {
  id: string;
  type: string;
  year: number;
  month: number;
  day: number;
  encrypted_content: string;
  iv: string;
}

const ENTRY_TYPES = ["journal", "food", "idea", "note"] as const;
const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function BrowsePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const { isLocked, setIsLocked } = useVisibilityLock();

  useEffect(() => {
    const cleanup = initActivityListeners();
    onLock(() => setIsLocked(true));
    return cleanup;
  }, [setIsLocked]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (year !== null) params.set("year", String(year));
    if (month !== null) params.set("month", String(month));
    if (day !== null) params.set("day", String(day));
    if (typeFilter) params.set("type", typeFilter);

    const res = await fetch(`/api/entries?${params}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [year, month, day, typeFilter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (!isLocked && !getKey()) {
      setNeedsPassphrase(true);
    }
  }, [isLocked]);

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  if (needsPassphrase) {
    return (
      <div className="mx-auto max-w-2xl p-6 space-y-6">
        <h1 className="text-2xl font-bold">Browse</h1>
        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Enter your passphrase to decrypt entries.
          </p>
          <PassphrasePrompt
            onUnlock={() => setNeedsPassphrase(false)}
          />
        </div>
      </div>
    );
  }

  // Compute distinct values for drill-down
  const years = [...new Set(entries.map((e) => e.year))].sort((a, b) => b - a);
  const months = year !== null
    ? [...new Set(entries.filter((e) => e.year === year).map((e) => e.month))].sort((a, b) => b - a)
    : [];
  const days = year !== null && month !== null
    ? [...new Set(entries.filter((e) => e.year === year && e.month === month).map((e) => e.day))].sort((a, b) => b - a)
    : [];

  const filteredEntries = day !== null
    ? entries.filter((e) => e.year === year && e.month === month && e.day === day)
    : [];

  // Breadcrumb navigation
  function resetTo(level: "root" | "year" | "month") {
    if (level === "root") { setYear(null); setMonth(null); setDay(null); }
    else if (level === "year") { setMonth(null); setDay(null); }
    else if (level === "month") { setDay(null); }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Browse</h1>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button className="text-primary hover:underline" onClick={() => resetTo("root")}>
          All
        </button>
        {year !== null && (
          <>
            <span>/</span>
            <button className="text-primary hover:underline" onClick={() => resetTo("year")}>
              {year}
            </button>
          </>
        )}
        {month !== null && (
          <>
            <span>/</span>
            <button className="text-primary hover:underline" onClick={() => resetTo("month")}>
              {MONTH_NAMES[month]}
            </button>
          </>
        )}
        {day !== null && (
          <>
            <span>/</span>
            <span>{day}</span>
          </>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        <Badge
          variant={typeFilter === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setTypeFilter(null)}
        >
          All
        </Badge>
        {ENTRY_TYPES.map((t) => (
          <Badge
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
          >
            {t}
          </Badge>
        ))}
      </div>

      <Separator />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : year === null ? (
        // Year list
        <div className="space-y-2">
          {years.length === 0 && <p className="text-muted-foreground">No entries yet.</p>}
          {years.map((y) => (
            <Button key={y} variant="outline" className="w-full justify-start" onClick={() => setYear(y)}>
              {y}
              <span className="ml-auto text-muted-foreground">
                {entries.filter((e) => e.year === y).length} entries
              </span>
            </Button>
          ))}
        </div>
      ) : month === null ? (
        // Month list
        <div className="space-y-2">
          {months.map((m) => (
            <Button key={m} variant="outline" className="w-full justify-start" onClick={() => setMonth(m)}>
              {MONTH_NAMES[m]}
              <span className="ml-auto text-muted-foreground">
                {entries.filter((e) => e.year === year && e.month === m).length} entries
              </span>
            </Button>
          ))}
        </div>
      ) : day === null ? (
        // Day list
        <div className="space-y-2">
          {days.map((d) => (
            <Button key={d} variant="outline" className="w-full justify-start" onClick={() => setDay(d)}>
              {MONTH_NAMES[month!]} {d}
              <span className="ml-auto text-muted-foreground">
                {entries.filter((e) => e.year === year && e.month === month && e.day === d).length} entries
              </span>
            </Button>
          ))}
        </div>
      ) : (
        // Entry cards
        <div className="space-y-3">
          {filteredEntries.length === 0 && <p className="text-muted-foreground">No entries for this day.</p>}
          {filteredEntries.map((entry) => (
            <EntryCard key={entry.id} {...entry} />
          ))}
        </div>
      )}
    </div>
  );
}
