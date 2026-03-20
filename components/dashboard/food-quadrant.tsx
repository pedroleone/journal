"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { QuadrantCard } from "./quadrant-card";
import { MealRow } from "@/components/shared/meal-row";
import { InboxBadge } from "@/components/shared/inbox-badge";
import { getFoodEntryPreview, type MealSlot } from "@/lib/food";

interface FoodEntry {
  id: string;
  meal_slot: MealSlot | null;
  content?: string;
  encrypted_content?: string;
  logged_at: string;
}

interface FoodQuadrantProps {
  date: Date;
}

interface FoodSnapshot {
  requestKey: string;
  entries: FoodEntry[];
  unsortedCount: number;
}

export function FoodQuadrant({ date }: FoodQuadrantProps) {
  const [snapshot, setSnapshot] = useState<FoodSnapshot | null>(null);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const requestKey = `${y}-${m}-${d}`;

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/food?year=${y}&month=${m}&day=${d}`).then((r) => r.json()),
      fetch("/api/food?uncategorized=true").then((r) => r.json()),
    ])
      .then(([dayEntries, uncategorized]: [FoodEntry[], FoodEntry[]]) => {
        if (cancelled) return;
        setSnapshot({
          requestKey,
          entries: dayEntries,
          unsortedCount: uncategorized.length,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSnapshot({
          requestKey,
          entries: [],
          unsortedCount: 0,
        });
      })
      .finally(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [d, m, requestKey, y]);

  const entries = snapshot?.requestKey === requestKey ? snapshot.entries : [];
  const unsortedCount =
    snapshot?.requestKey === requestKey ? snapshot.unsortedCount : 0;
  const loading = snapshot?.requestKey !== requestKey;

  const assigned = entries.filter((e) => e.meal_slot);
  const filledSlots = new Set(assigned.map((e) => e.meal_slot));

  return (
    <QuadrantCard
      domain="food"
      label="Food"
      href="/food/browse"
      actions={
        <Link
          href="/food"
          className="flex h-5 w-5 items-center justify-center rounded bg-[var(--food-dim)] text-[var(--food)] hover:bg-[var(--food)]/25"
        >
          <Plus className="h-3 w-3" />
        </Link>
      }
      footer={
        <>
          <span>{filledSlots.size} slots filled</span>
          <InboxBadge count={unsortedCount} />
        </>
      }
    >
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted/30" />
          ))}
        </div>
      ) : assigned.length > 0 ? (
        <div className="space-y-0.5">
          {assigned.slice(0, 5).map((e) => (
            <MealRow
              key={e.id}
              slot={e.meal_slot!}
              description={getFoodEntryPreview(e).slice(0, 60)}
              time={new Date(e.logged_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No meals logged
        </p>
      )}
    </QuadrantCard>
  );
}
