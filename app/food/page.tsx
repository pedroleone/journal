"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { FoodMealSlotCard } from "@/components/food/food-meal-slot-card";
import { FoodQuickAdd } from "@/components/food/food-quick-add";
import { buildMealSlotState } from "@/components/food/food-day-state";
import { Button } from "@/components/ui/button";
import type { MealSlot } from "@/lib/food";
import { MEAL_SLOTS } from "@/lib/food";
import { useLocale } from "@/hooks/use-locale";

interface FoodEntryView {
  id: string;
  source: "web";
  year: number;
  month: number;
  day: number;
  hour: number | null;
  meal_slot: MealSlot | null;
  content: string;
  logged_at: string;
  images: string[] | null;
  tags: string[] | null;
}

function formatDateLabel(date: Date, localeCode: string) {
  return date.toLocaleDateString(localeCode, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getMealSlotLabel(slot: MealSlot, t: ReturnType<typeof useLocale>["t"]) {
  return t.food[slot];
}

export default function FoodPage() {
  const { t } = useLocale();
  const router = useRouter();
  const selectedDate = useMemo(() => new Date(), []);
  const [dayEntries, setDayEntries] = useState<FoodEntryView[]>([]);
  const [uncategorizedEntries, setUncategorizedEntries] = useState<FoodEntryView[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [view, setView] = useState<"day" | "inbox">("day");

  const mealSlots = useMemo(
    () =>
      MEAL_SLOTS.map((slot) => ({
        value: slot,
        label: getMealSlotLabel(slot, t),
      })),
    [t],
  );

  const loadDayEntries = useCallback(async () => {
    const params = new URLSearchParams({
      year: String(selectedDate.getFullYear()),
      month: String(selectedDate.getMonth() + 1),
      day: String(selectedDate.getDate()),
    });

    const response = await fetch(`/api/food?${params}`);
    if (!response.ok) return;

    const data: FoodEntryView[] = await response.json();
    setDayEntries(data);
  }, [selectedDate]);

  const loadUncategorizedCount = useCallback(async () => {
    const response = await fetch("/api/food?uncategorized=true");
    if (!response.ok) return;

    const data: FoodEntryView[] = await response.json();
    setUncategorizedEntries(data);
    setUncategorizedCount(data.length);
  }, []);

  const handleAddToSlot = useCallback(
    async (slot: MealSlot) => {
      const response = await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "",
          images: [],
          meal_slot: slot,
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
        }),
      });

      if (!response.ok) return;
      const data = (await response.json()) as { id: string };
      router.push(`/food/entry/${data.id}?edit=true`);
    },
    [router, selectedDate],
  );

  const handleSkipSlot = useCallback(
    async (slot: MealSlot) => {
      const response = await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "",
          meal_slot: slot,
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
          tags: ["skipped"],
        }),
      });

      if (!response.ok) return;
      await loadDayEntries();
    },
    [loadDayEntries, selectedDate],
  );

  const handleUndoSkip = useCallback(
    async (entryId: string) => {
      const response = await fetch(`/api/food/${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) return;
      await loadDayEntries();
    },
    [loadDayEntries],
  );

  useEffect(() => {
    void loadDayEntries();
    void loadUncategorizedCount();
  }, [loadDayEntries, loadUncategorizedCount]);

  return (
    <div className="animate-page min-h-dvh bg-[var(--surface-canvas)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <header className="flex min-h-14 flex-wrap items-center gap-3 border-b border-border/60 bg-[var(--surface-topbar)] px-4 py-3">
          <Link href="/" className="text-sm font-medium text-[var(--food)] hover:opacity-80">
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Food</span>
          <span className="ml-auto text-sm text-muted-foreground">
            {formatDateLabel(selectedDate, t.localeCode)}
          </span>
        </header>

        <div className="px-4 py-4">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <FoodQuickAdd
              year={selectedDate.getFullYear()}
              month={selectedDate.getMonth() + 1}
              day={selectedDate.getDate()}
              onSaved={async () => {
                setView("inbox");
                await Promise.all([loadDayEntries(), loadUncategorizedCount()]);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setView("inbox")}
            >
              {`Inbox (${uncategorizedCount})`}
            </Button>
            <Button variant="outline" size="sm" type="button">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Button>
            {view === "inbox" ? (
              <Button variant="ghost" size="sm" type="button" onClick={() => setView("day")}>
                Day View
              </Button>
            ) : null}
          </div>

          {view === "inbox" ? (
            <section className="space-y-4">
              <div className="rounded-3xl border border-border/60 bg-card/30 p-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  {t.food.uncategorizedEntries}
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {uncategorizedEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-3xl border border-border/60 bg-card/30 p-4"
                  >
                    <p className="text-sm leading-relaxed">{entry.content || t.food.photoEntry}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/food/entry/${entry.id}`}>{t.food.open}</Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mealSlots.map((slot) => {
                const state = buildMealSlotState(slot.value, dayEntries);
                const skippedId = state.kind === "skipped" ? state.skippedEntry.id : null;

                return (
                  <FoodMealSlotCard
                    key={slot.value}
                    slot={slot.value}
                    slotLabel={slot.label}
                    state={state}
                    canSkip={slot.value !== "observation"}
                    onAdd={() => void handleAddToSlot(slot.value)}
                    onSkip={() => void handleSkipSlot(slot.value)}
                    onUndoSkip={
                      skippedId ? () => void handleUndoSkip(skippedId) : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
