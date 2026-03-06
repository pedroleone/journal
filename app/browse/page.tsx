"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
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
  const [hasKey, setHasKey] = useState(() => !!getKey());
  const { isLocked, setIsLocked } = useVisibilityLock();

  useEffect(() => {
    const cleanup = initActivityListeners();
    onLock(() => setIsLocked(true));
    return cleanup;
  }, [setIsLocked]);

  useEffect(() => {
    let cancelled = false;
    async function fetchEntries() {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/entries?${params}`);
      if (cancelled) return;
      const data = await res.json();
      if (cancelled) return;
      setEntries(data);
      setLoading(false);
    }
    fetchEntries();
    return () => { cancelled = true; };
  }, [typeFilter]);

  const needsPassphrase = !isLocked && !hasKey;

  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  if (needsPassphrase) {
    return (
      <div className="animate-page mx-auto max-w-2xl px-6 py-10 space-y-8">
        <h1 className="font-display text-3xl tracking-tight">Browse</h1>
        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Enter your passphrase to decrypt entries.
          </p>
          <PassphrasePrompt onUnlock={() => setHasKey(true)} />
        </div>
      </div>
    );
  }

  const groups = groupByDate(entries);

  return (
    <div className="animate-page mx-auto max-w-2xl px-6 py-10 space-y-8">
      <h1 className="font-display text-3xl tracking-tight">Browse</h1>

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
            className="cursor-pointer capitalize"
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
          >
            {t}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : groups.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No entries yet.</p>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.key}>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
