"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EncryptedImageGallery } from "@/components/encrypted-image-gallery";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MealSlot, getMonthDays, suggestMealSlot } from "@/lib/food";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

type SelectedState =
  | { kind: "uncategorized" }
  | { kind: "date"; year: number; month: number; day: number };

interface DateCount {
  year: number;
  month: number;
  day: number;
  count: number;
}

interface RawFoodEntry {
  id: string;
  source: "web" | "telegram";
  year: number;
  month: number;
  day: number;
  hour: number | null;
  meal_slot: MealSlot | null;
  content: string;
  logged_at: string;
  images: string[] | null;
}

interface FoodEntryView {
  id: string;
  source: "web" | "telegram";
  year: number;
  month: number;
  day: number;
  hour: number | null;
  meal_slot: MealSlot | null;
  content: string;
  logged_at: string;
  images: string[] | null;
}

interface AssignDraft {
  date: Date;
  mealSlot: MealSlot | "";
}

const MEAL_SLOTS: Array<{ value: MealSlot; label: string }> = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayLabel(year: number, month: number, day: number): string {
  return DAY_NAMES[new Date(year, month - 1, day).getDay()];
}

function formatDateTitle(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatLoggedAt(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string, hour: number | null): string {
  if (hour !== null) return `${String(hour).padStart(2, "0")}:00`;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getTree(dates: DateCount[]) {
  const yearMap = new Map<number, Map<number, Map<number, number>>>();
  for (const d of dates) {
    if (!yearMap.has(d.year)) yearMap.set(d.year, new Map());
    const monthMap = yearMap.get(d.year)!;
    if (!monthMap.has(d.month)) monthMap.set(d.month, new Map());
    monthMap.get(d.month)!.set(d.day, Number(d.count));
  }

  return [...yearMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, monthMap]) => ({
      year,
      months: [...monthMap.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([month, dayMap]) => ({
          month,
          days: getMonthDays(year, month).map((day) => ({
            day,
            count: dayMap.get(day) ?? 0,
          })),
        })),
    }));
}

export default function FoodBrowsePage() {
  const [selected, setSelected] = useState<SelectedState>({ kind: "uncategorized" });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dates, setDates] = useState<DateCount[]>([]);
  const [uncategorized, setUncategorized] = useState<FoodEntryView[]>([]);
  const [dayEntries, setDayEntries] = useState<FoodEntryView[]>([]);
  const [assignDrafts, setAssignDrafts] = useState<Record<string, AssignDraft>>({});
  const [loadingPane, setLoadingPane] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assigningAll, setAssigningAll] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const tree = useMemo(() => getTree(dates), [dates]);
  const now = new Date();

  const loadDates = useCallback(async () => {
    const res = await fetch("/api/food/dates");
    if (!res.ok) return;
    const data = await res.json();
    setDates(data);
  }, []);

  const loadUncategorized = useCallback(async () => {
    setLoadingPane(true);
    try {
      const res = await fetch("/api/food?uncategorized=true");
      if (!res.ok) return;
      const raw: RawFoodEntry[] = await res.json();
      const dec = raw;
      setUncategorized(dec);

      const draftState: Record<string, AssignDraft> = {};
      for (const entry of dec) {
        const loggedDate = new Date(entry.logged_at);
        const hour = entry.hour ?? loggedDate.getHours();
        draftState[entry.id] = {
          date: new Date(entry.year, entry.month - 1, entry.day),
          mealSlot: suggestMealSlot(hour),
        };
      }
      setAssignDrafts(draftState);
    } finally {
      setLoadingPane(false);
    }
  }, []);

  const loadDayEntries = useCallback(
    async (year: number, month: number, day: number) => {
      setLoadingPane(true);
      try {
        const params = new URLSearchParams({
          year: String(year),
          month: String(month),
          day: String(day),
        });
        const res = await fetch(`/api/food?${params}`);
        if (!res.ok) return;
        const raw: RawFoodEntry[] = await res.json();
        setDayEntries(raw);
      } finally {
        setLoadingPane(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadDates();
    loadUncategorized();
  }, [loadDates, loadUncategorized]);

  useEffect(() => {
    if (selected.kind === "date") {
      loadDayEntries(selected.year, selected.month, selected.day);
    }
  }, [selected, loadDayEntries]);

  function handleSelectDate(year: number, month: number, day: number) {
    setSelected({ kind: "date", year, month, day });
    if (isMobile) setSidebarOpen(false);
  }

  function handleSelectUncategorized() {
    setSelected({ kind: "uncategorized" });
    if (isMobile) setSidebarOpen(false);
  }

  function setDraftDate(id: string, date: Date) {
    setAssignDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        date,
      },
    }));
  }

  function setDraftMealSlot(id: string, mealSlot: MealSlot | "") {
    setAssignDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        mealSlot,
      },
    }));
  }

  async function handleAssign(id: string) {
    const draft = assignDrafts[id];
    if (!draft) return;

    setAssigningId(id);
    try {
      const logged = uncategorized.find((entry) => entry.id === id);
      const loggedHour = logged?.hour ?? new Date(logged?.logged_at ?? new Date()).getHours();

      const body = {
        year: draft.date.getFullYear(),
        month: draft.date.getMonth() + 1,
        day: draft.date.getDate(),
        hour: loggedHour,
        meal_slot: draft.mealSlot || null,
      };

      const res = await fetch(`/api/food/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;

      await Promise.all([loadUncategorized(), loadDates()]);
      if (selected.kind === "date") {
        await loadDayEntries(selected.year, selected.month, selected.day);
      }
    } finally {
      setAssigningId(null);
    }
  }

  async function handleAssignAll() {
    setAssigningAll(true);
    try {
      const res = await fetch("/api/food/assign-all", { method: "POST" });
      if (!res.ok) return;
      await Promise.all([loadUncategorized(), loadDates()]);
      if (selected.kind === "date") {
        await loadDayEntries(selected.year, selected.month, selected.day);
      }
    } finally {
      setAssigningAll(false);
    }
  }

  const showSidebar = isMobile ? sidebarOpen : true;
  const showContent = isMobile ? !sidebarOpen : true;

  const groups: Record<MealSlot, FoodEntryView[]> = {
    breakfast: dayEntries.filter((e) => e.meal_slot === "breakfast"),
    lunch: dayEntries.filter((e) => e.meal_slot === "lunch"),
    dinner: dayEntries.filter((e) => e.meal_slot === "dinner"),
    snack: dayEntries.filter((e) => e.meal_slot === "snack"),
  };

  const unassignedForDay = dayEntries.filter((e) => !e.meal_slot);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {showSidebar && (
        <div className={cn("border-r border-border/60", isMobile ? "w-full" : "w-80")}>
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link href="/food?mode=food">← Quick Log</Link>
                </Button>
                <button
                  onClick={handleSelectUncategorized}
                  className={cn(
                    "w-full rounded-md px-2 py-2 text-left text-sm transition-colors",
                    selected.kind === "uncategorized"
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  )}
                >
                  Uncategorized ({uncategorized.length})
                </button>

                {tree.map((yearGroup) => (
                  <Collapsible key={yearGroup.year} defaultOpen={yearGroup.year === now.getFullYear()}>
                    <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
                      {yearGroup.year}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-2 space-y-0.5">
                        {yearGroup.months.map((monthGroup) => (
                          <Collapsible
                            key={`${yearGroup.year}-${monthGroup.month}`}
                            defaultOpen={
                              yearGroup.year === now.getFullYear() &&
                              monthGroup.month === now.getMonth() + 1
                            }
                          >
                            <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground">
                              <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                              {MONTH_NAMES[monthGroup.month]}
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-4 space-y-0.5 py-0.5">
                                {monthGroup.days.map(({ day, count }) => {
                                  const isActive =
                                    selected.kind === "date" &&
                                    selected.year === yearGroup.year &&
                                    selected.month === monthGroup.month &&
                                    selected.day === day;

                                  return (
                                    <button
                                      key={`${yearGroup.year}-${monthGroup.month}-${day}`}
                                      onClick={() =>
                                        handleSelectDate(yearGroup.year, monthGroup.month, day)
                                      }
                                      className={cn(
                                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                                        isActive
                                          ? "bg-secondary font-medium text-foreground"
                                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                                      )}
                                    >
                                      <span>
                                        {getDayLabel(yearGroup.year, monthGroup.month, day)},{" "}
                                        {String(day).padStart(2, "0")}/
                                        {String(monthGroup.month).padStart(2, "0")}
                                      </span>
                                      <span className="text-xs text-muted-foreground">({count})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {showContent && (
        <div className="flex-1 overflow-y-auto">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-6 pt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {loadingPane ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : selected.kind === "uncategorized" ? (
            <div className="animate-page mx-auto max-w-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl tracking-tight">Uncategorized Entries</h1>
                <Button onClick={handleAssignAll} disabled={assigningAll || uncategorized.length === 0}>
                  {assigningAll ? "Assigning..." : "Assign All by Date"}
                </Button>
              </div>

              {uncategorized.length === 0 ? (
                <p className="text-sm text-muted-foreground">No uncategorized food entries.</p>
              ) : (
                uncategorized.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border/60 p-4 space-y-3">
                    {entry.content ? (
                      <p className="text-sm leading-relaxed">{entry.content}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">Photo entry</p>
                    )}
                    {entry.images?.length ? (
                      <EncryptedImageGallery
                        imageKeys={entry.images}
                        imageClassName="h-32"
                      />
                    ) : null}
                    <p className="text-xs text-muted-foreground">{formatLoggedAt(entry.logged_at)}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            {assignDrafts[entry.id]?.date
                              ? formatDateTitle(
                                  assignDrafts[entry.id].date.getFullYear(),
                                  assignDrafts[entry.id].date.getMonth() + 1,
                                  assignDrafts[entry.id].date.getDate(),
                                )
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={assignDrafts[entry.id]?.date}
                            onSelect={(d) => d && setDraftDate(entry.id, d)}
                          />
                        </PopoverContent>
                      </Popover>

                      <Select
                        value={assignDrafts[entry.id]?.mealSlot ?? ""}
                        onValueChange={(value) =>
                          setDraftMealSlot(entry.id, value === "none" ? "" : (value as MealSlot))
                        }
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Meal slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No slot</SelectItem>
                          {MEAL_SLOTS.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        onClick={() => handleAssign(entry.id)}
                        disabled={assigningId === entry.id}
                      >
                        {assigningId === entry.id ? "Assigning..." : "Assign"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="animate-page mx-auto max-w-3xl p-6 sm:p-8 space-y-6">
              <h1 className="font-display text-2xl tracking-tight">
                {formatDateTitle(selected.year, selected.month, selected.day)}
              </h1>

              {MEAL_SLOTS.map((slot) => (
                <section key={slot.value} className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">{slot.label}</h2>
                  {groups[slot.value].length === 0 ? (
                    <p className="text-sm text-muted-foreground">(empty)</p>
                  ) : (
                    <div className="space-y-2">
                      {groups[slot.value].map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-border/50 bg-card/20 px-3 py-2"
                        >
                          {entry.content ? (
                            <p className="text-sm leading-relaxed">{entry.content}</p>
                          ) : (
                            <p className="text-sm italic text-muted-foreground">Photo entry</p>
                          )}
                          {entry.images?.length ? (
                            <EncryptedImageGallery
                              imageKeys={entry.images}
                              className="mt-3"
                              imageClassName="h-32"
                            />
                          ) : null}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatTime(entry.logged_at, entry.hour)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}

              {unassignedForDay.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">Uncategorized</h2>
                  <div className="space-y-2">
                    {unassignedForDay.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-border/50 bg-card/20 px-3 py-2"
                      >
                        {entry.content ? (
                          <p className="text-sm leading-relaxed">{entry.content}</p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">Photo entry</p>
                        )}
                        {entry.images?.length ? (
                          <EncryptedImageGallery
                            imageKeys={entry.images}
                            className="mt-3"
                            imageClassName="h-32"
                          />
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTime(entry.logged_at, entry.hour)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
