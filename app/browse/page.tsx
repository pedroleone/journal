"use client";

import { useState, useEffect, useCallback } from "react";
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

function formatDateHeading(year: number, month: number, day: number) {
  return `${MONTH_NAMES[month]} ${day}, ${year}`;
}

function groupByDate(entries: Entry[]) {
  const groups: { key: string; label: string; entries: Entry[] }[] = [];
  const map = new Map<string, Entry[]>();

  for (const entry of entries) {
    const key = `${entry.year}-${entry.month}-${entry.day}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }

  for (const [key, items] of map) {
    const first = items[0];
    groups.push({
      key,
      label: formatDateHeading(first.year, first.month, first.day),
      entries: items,
    });
  }

  return groups;
}

export default function BrowsePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (typeFilter) params.set("type", typeFilter);

    const res = await fetch(`/api/entries?${params}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [typeFilter]);

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
          <PassphrasePrompt onUnlock={() => setNeedsPassphrase(false)} />
        </div>
      </div>
    );
  }

  const groups = groupByDate(entries);

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Browse</h1>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
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
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.entries.map((entry) => (
                  <EntryCard key={entry.id} {...entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
