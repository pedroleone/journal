"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [visibleMonthState, setVisibleMonthState] = useState<{
    anchorDateParam: string | null;
    month: JournalCalendarMonth;
  }>(() => ({
    anchorDateParam: explicitDateParam,
    month: getInitialMonth(explicitSelection),
  }));
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { t } = useLocale();

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

  const visibleMonth =
    visibleMonthState.anchorDateParam === explicitDateParam
      ? visibleMonthState.month
      : getInitialMonth(explicitSelection);
  const selectedEmptyDay =
    datesLoaded && explicitSelection && !entriesByDate.has(toDateKey(explicitSelection))
      ? explicitSelection
      : null;

  function handleSelectDay(day: JournalCalendarDay) {
    const dateKey = toDateKey(day);
    const entryId = entriesByDate.get(dateKey);

    if (entryId) {
      router.push(`/journal/entry/${entryId}`);
      return;
    }

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
            onChangeMonth={(month) => {
              setVisibleMonthState({
                anchorDateParam: explicitDateParam,
                month,
              });
            }}
          />

          {!isOnline ? (
            <div className="flex min-h-[22vh] items-center justify-center rounded-[28px] border border-border/60 bg-card/35 px-6 text-center">
              <p className="text-sm text-muted-foreground">{t.journal.reconnectToLoad}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
