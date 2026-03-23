"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useLocale } from "@/hooks/use-locale";
import {
  JournalMonthCalendar,
  type JournalCalendarDay,
  type JournalCalendarMonth,
} from "@/components/journal/journal-month-calendar";

interface DateEntry {
  id: string;
  year: number;
  month: number;
  day: number;
}

function parseSelectedDate(searchParams: URLSearchParams): JournalCalendarDay | null {
  const dateParam = searchParams.get("date");
  if (!dateParam) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function toDateKey(value: JournalCalendarDay): string {
  return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

function formatSelectedDate(value: JournalCalendarDay): string {
  return new Date(value.year, value.month - 1, value.day).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getInitialMonth(selection: JournalCalendarDay | null): JournalCalendarMonth {
  if (selection) return { year: selection.year, month: selection.month };

  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const explicitDateParam = searchParams.get("date");
  const explicitSelection = useMemo(
    () => parseSelectedDate(new URLSearchParams(explicitDateParam ? `date=${explicitDateParam}` : "")),
    [explicitDateParam],
  );
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [datesLoaded, setDatesLoaded] = useState(false);
  const [selectedEmptyDay, setSelectedEmptyDay] = useState<JournalCalendarDay | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<JournalCalendarMonth>(() => getInitialMonth(explicitSelection));
  const lastSyncedDateParamRef = useRef<string | null | undefined>(undefined);
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { t } = useLocale();

  useEffect(() => {
    setVisibleMonth(getInitialMonth(explicitSelection));
    setSelectedEmptyDay(null);
  }, [explicitSelection]);

  useEffect(() => {
    if (!isOnline) return;

    let cancelled = false;
    fetch("/api/entries/dates")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: DateEntry[]) => {
        if (cancelled) return;
        setDates(data);
        setDatesLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setDates([]);
        setDatesLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of dates) {
      map.set(
        `${entry.year}-${String(entry.month).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`,
        entry.id,
      );
    }
    return map;
  }, [dates]);

  useEffect(() => {
    if (!datesLoaded) return;
    if (lastSyncedDateParamRef.current === explicitDateParam) return;

    lastSyncedDateParamRef.current = explicitDateParam;

    if (!explicitSelection) {
      setSelectedEmptyDay(null);
      return;
    }

    const dateKey = toDateKey(explicitSelection);
    setSelectedEmptyDay(entriesByDate.has(dateKey) ? null : explicitSelection);
  }, [datesLoaded, entriesByDate, explicitDateParam, explicitSelection]);

  function handleSelectDay(day: JournalCalendarDay) {
    const dateKey = toDateKey(day);
    const entryId = entriesByDate.get(dateKey);

    if (entryId) {
      router.push(`/journal/entry/${entryId}`);
      return;
    }

    setSelectedEmptyDay(day);
    router.replace(`/journal/browse?date=${dateKey}`);
  }

  return (
    <div className="flex h-full min-h-0 bg-background">
      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-6 sm:px-6">
          {!isOnline && (
            <div className="rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
              {t.journal.offlineBrowse}
            </div>
          )}

          <JournalMonthCalendar
            visibleMonth={visibleMonth}
            selectedDate={selectedEmptyDay}
            entryDates={Array.from(entriesByDate.keys())}
            onSelectDay={handleSelectDay}
            onChangeMonth={setVisibleMonth}
          />

          {selectedEmptyDay ? (
            <section className="rounded-[28px] border border-border/60 bg-card/35 px-6 py-7">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {formatSelectedDate(selectedEmptyDay)}
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground">
                No entry for this day
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Pick another marked date to read an entry, or start writing for this day.
              </p>
              <div className="mt-6">
                <Link
                  href={`/journal/write?year=${selectedEmptyDay.year}&month=${selectedEmptyDay.month}&day=${selectedEmptyDay.day}`}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--journal)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Write for this day
                </Link>
              </div>
            </section>
          ) : !isOnline ? (
            <div className="flex min-h-[22vh] items-center justify-center rounded-[28px] border border-border/60 bg-card/35 px-6 text-center">
              <p className="text-sm text-muted-foreground">{t.journal.reconnectToLoad}</p>
            </div>
          ) : (
            <div className="flex min-h-[22vh] items-center justify-center rounded-[28px] border border-border/60 bg-card/35 px-6 text-center">
              <p className="text-sm text-muted-foreground">{t.journal.selectDate}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
