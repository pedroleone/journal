"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FoodMealSlotCard } from "@/components/food/food-meal-slot-card";
import { FoodInboxPanel } from "@/components/food/food-inbox-panel";
import { FoodPageShell } from "@/components/food/food-page-shell";
import { buildMealSlotState } from "@/components/food/food-day-state";
import type { MealSlot } from "@/lib/food";
import { MEAL_SLOTS, getVisibleSlots } from "@/lib/food";
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

function getMealSlotLabel(slot: MealSlot, t: ReturnType<typeof useLocale>["t"]) {
  return t.food[slot];
}

function parseWorkspaceDate(value: string | null): Date | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function formatWorkspaceDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function FoodPage() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamKey = searchParams.toString();
  const initialDate = useMemo(
    () => parseWorkspaceDate(searchParams.get("date")) ?? new Date(),
    [searchParamKey],
  );
  const initialView = searchParams.get("view") === "inbox" ? "inbox" : "day";
  const [selectedDate, setSelectedDate] = useState(
    () => initialDate,
  );
  const [dayEntries, setDayEntries] = useState<FoodEntryView[]>([]);
  const [uncategorizedEntries, setUncategorizedEntries] = useState<FoodEntryView[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [view, setView] = useState<"day" | "inbox">(() => initialView);
  const [snacksExpanded, setSnacksExpanded] = useState(false);
  const [dayLoading, setDayLoading] = useState(true);
  const [inboxLoading, setInboxLoading] = useState(true);
  const selectedDateRef = useRef(selectedDate);
  const viewRef = useRef(view);
  const skipNextUrlSyncRef = useRef(false);
  const externalSearchKeyRef = useRef<string | null>(null);
  const dayRequestRef = useRef(0);
  const inboxRequestRef = useRef(0);
  selectedDateRef.current = selectedDate;
  viewRef.current = view;

  const mealSlots = useMemo(
    () =>
      MEAL_SLOTS.map((slot) => ({
        value: slot,
        label: getMealSlotLabel(slot, t),
      })),
    [t],
  );
  const workspaceReturnTo = useMemo(() => {
    const params = new URLSearchParams({
      date: formatWorkspaceDate(selectedDate),
      view,
    });
    return `${pathname}?${params.toString()}`;
  }, [pathname, selectedDate, view]);

  const loadDayEntries = useCallback(async (date = selectedDateRef.current) => {
    const requestId = ++dayRequestRef.current;
    setDayLoading(true);
    if (requestId === dayRequestRef.current) {
      setDayEntries([]);
    }
    const params = new URLSearchParams({
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1),
      day: String(date.getDate()),
    });

    try {
      const response = await fetch(`/api/food?${params}`);
      if (!response.ok) {
        if (requestId === dayRequestRef.current) {
          setDayEntries([]);
          setDayLoading(false);
        }
        return;
      }

      const data: FoodEntryView[] = await response.json();
      if (requestId !== dayRequestRef.current) return;
      setDayEntries(data);
      setDayLoading(false);
    } catch {
      if (requestId === dayRequestRef.current) {
        setDayEntries([]);
        setDayLoading(false);
      }
    }
  }, []);

  const loadUncategorized = useCallback(async () => {
    const requestId = ++inboxRequestRef.current;
    setInboxLoading(true);
    if (requestId === inboxRequestRef.current) {
      setUncategorizedEntries([]);
    }
    try {
      const response = await fetch("/api/food?uncategorized=true");
      if (!response.ok) {
        if (requestId === inboxRequestRef.current) {
          setUncategorizedEntries([]);
          setUncategorizedCount(0);
          setInboxLoading(false);
        }
        return;
      }

      const data: FoodEntryView[] = await response.json();
      if (requestId !== inboxRequestRef.current) return;
      setUncategorizedEntries(data);
      setUncategorizedCount(data.length);
      setInboxLoading(false);
    } catch {
      if (requestId === inboxRequestRef.current) {
        setUncategorizedEntries([]);
        setUncategorizedCount(0);
        setInboxLoading(false);
      }
    }
  }, []);

  const refreshVisibleWorkspace = useCallback(async () => {
    await Promise.all([loadDayEntries(), loadUncategorized()]);
  }, [loadDayEntries, loadUncategorized]);

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

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      const response = await fetch(`/api/food/${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) return;
      await loadDayEntries();
    },
    [loadDayEntries],
  );

  const handleAssignEntry = useCallback(
    async (entryId: string, mealSlot: MealSlot | null) => {
      const response = await fetch(`/api/food/${entryId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
          meal_slot: mealSlot,
        }),
      });

      if (!response.ok) return;
      await refreshVisibleWorkspace();
    },
    [refreshVisibleWorkspace, selectedDate],
  );

  const handleDeleteInboxEntry = useCallback(
    async (entryId: string) => {
      const response = await fetch(`/api/food/${entryId}`, {
        method: "DELETE",
      });

      if (!response.ok) return;
      await refreshVisibleWorkspace();
    },
    [refreshVisibleWorkspace],
  );

  const handleEntrySaved = useCallback(async () => {
    await loadDayEntries();
  }, [loadDayEntries]);

  useEffect(() => {
    void loadDayEntries(selectedDate);
  }, [loadDayEntries, selectedDate]);

  useEffect(() => {
    void loadUncategorized();
  }, [loadUncategorized]);

  useEffect(() => {
    const nextDate = searchParams.has("date")
      ? parseWorkspaceDate(searchParams.get("date")) ?? new Date()
      : selectedDateRef.current;
    const nextView = searchParams.has("view")
      ? searchParams.get("view") === "inbox"
        ? "inbox"
        : "day"
      : viewRef.current;
    const nextDateKey = formatWorkspaceDate(nextDate);
    const shouldSyncFromUrl =
      formatWorkspaceDate(selectedDateRef.current) !== nextDateKey || viewRef.current !== nextView;

    if (!shouldSyncFromUrl) return;

    skipNextUrlSyncRef.current = true;
    externalSearchKeyRef.current = searchParamKey;
    setSelectedDate((currentDate) =>
      formatWorkspaceDate(currentDate) === nextDateKey ? currentDate : nextDate,
    );
    setView((currentView) => (currentView === nextView ? currentView : nextView));
  }, [searchParamKey]);

  useEffect(() => {
    if (skipNextUrlSyncRef.current) {
      skipNextUrlSyncRef.current = false;
      return;
    }
    if (externalSearchKeyRef.current === searchParamKey) {
      return;
    }

    const currentHref = searchParamKey ? `${pathname}?${searchParamKey}` : pathname;
    if (currentHref !== workspaceReturnTo) {
      router.replace(workspaceReturnTo, { scroll: false });
    }
  }, [pathname, router, searchParamKey, workspaceReturnTo]);

  return (
    <FoodPageShell
      date={selectedDate}
      inboxCount={uncategorizedCount}
      view={view}
      onDateChange={(date) => {
        externalSearchKeyRef.current = null;
        setSelectedDate(date);
      }}
      onQuickAddSaved={async () => {
        externalSearchKeyRef.current = null;
        setView("inbox");
        await refreshVisibleWorkspace();
      }}
      onOpenInbox={() => {
        externalSearchKeyRef.current = null;
        setView("inbox");
      }}
      onOpenDayView={() => {
        externalSearchKeyRef.current = null;
        setView("day");
      }}
    >
      {view === "inbox" ? (
        inboxLoading ? (
          <div className="rounded-3xl border border-border/60 bg-card/20 p-6 text-sm text-muted-foreground">
            {t.food.loading}
          </div>
        ) : (
          <FoodInboxPanel
            entries={uncategorizedEntries}
            mealSlots={mealSlots}
            onAssignEntry={handleAssignEntry}
            onDeleteEntry={handleDeleteInboxEntry}
            returnTo={workspaceReturnTo}
          />
        )
      ) : (
        dayLoading ? (
          <div className="rounded-3xl border border-border/60 bg-card/20 p-6 text-sm text-muted-foreground">
            {t.food.loading}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {getVisibleSlots(dayEntries, snacksExpanded).map((slotValue) => {
              const slotLabel = getMealSlotLabel(slotValue, t);
              const state = buildMealSlotState(slotValue, dayEntries);
              const skippedId = state.kind === "skipped" ? state.skippedEntry.id : null;

              return (
                <FoodMealSlotCard
                  key={slotValue}
                  slot={slotValue}
                  slotLabel={slotLabel}
                  state={state}
                  canSkip={slotValue !== "observation"}
                  year={selectedDate.getFullYear()}
                  month={selectedDate.getMonth() + 1}
                  day={selectedDate.getDate()}
                  onSkip={() => void handleSkipSlot(slotValue)}
                  onUndoSkip={skippedId ? () => void handleUndoSkip(skippedId) : undefined}
                  onDeleteEntry={handleDeleteEntry}
                  onEntrySaved={handleEntrySaved}
                  returnTo={workspaceReturnTo}
                />
              );
            })}
            {!snacksExpanded && (
              <button
                onClick={() => setSnacksExpanded(true)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                + Add snack
              </button>
            )}
          </div>
        )
      )}
    </FoodPageShell>
  );
}
