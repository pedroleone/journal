"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
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

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface JournalCalendarMonth {
  year: number;
  month: number;
}

export interface JournalCalendarDay extends JournalCalendarMonth {
  day: number;
}

interface JournalMonthCalendarProps {
  visibleMonth: JournalCalendarMonth;
  selectedDate: JournalCalendarDay | null;
  entryDates: string[];
  onSelectDay: (day: JournalCalendarDay) => void;
  onChangeMonth: (month: JournalCalendarMonth) => void;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateKey(value: JournalCalendarDay): string {
  return `${value.year}-${pad(value.month)}-${pad(value.day)}`;
}

function getPreviousMonth({ year, month }: JournalCalendarMonth): JournalCalendarMonth {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function getNextMonth({ year, month }: JournalCalendarMonth): JournalCalendarMonth {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

function buildCalendarDays({ year, month }: JournalCalendarMonth): Array<JournalCalendarDay | null> {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: Array<JournalCalendarDay | null> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ year, month, day });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function JournalMonthCalendar({
  visibleMonth,
  selectedDate,
  entryDates,
  onSelectDay,
  onChangeMonth,
}: JournalMonthCalendarProps) {
  const entryDateSet = new Set(entryDates);
  const monthLabel = `${MONTH_NAMES[visibleMonth.month - 1]} ${visibleMonth.year}`;
  const calendarDays = buildCalendarDays(visibleMonth);

  return (
    <section className="rounded-[28px] border border-border/60 bg-card/40 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onChangeMonth(getPreviousMonth(visibleMonth))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/70 text-foreground transition-colors hover:bg-secondary/60"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
          {monthLabel}
        </h2>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => onChangeMonth(getNextMonth(visibleMonth))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/70 text-foreground transition-colors hover:bg-secondary/60"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {WEEKDAY_NAMES.map((weekday) => (
          <div key={weekday} className="py-2">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((dayValue, index) => {
          if (!dayValue) {
            return <div key={`empty-${index}`} className="aspect-square rounded-2xl border border-transparent" />;
          }

          const dayKey = toDateKey(dayValue);
          const hasEntry = entryDateSet.has(dayKey);
          const isSelected = selectedDate ? toDateKey(selectedDate) === dayKey : false;
          const label = `${MONTH_NAMES[dayValue.month - 1]} ${dayValue.day}, ${dayValue.year}`;

          return (
            <button
              key={dayKey}
              type="button"
              aria-label={label}
              data-has-entry={String(hasEntry)}
              data-selected={String(isSelected)}
              onClick={() => onSelectDay(dayValue)}
              className={cn(
                "group aspect-square rounded-2xl border px-2 py-3 text-left transition-colors",
                isSelected
                  ? "border-[var(--journal)] bg-[var(--journal-dim)]"
                  : "border-border/50 bg-background/60 hover:border-[var(--journal)]/50 hover:bg-secondary/50",
              )}
            >
              <div className="flex h-full flex-col justify-between">
                <span className="text-sm font-medium text-foreground">{dayValue.day}</span>
                {hasEntry ? (
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--journal)]" aria-hidden="true" />
                ) : (
                  <span className="text-[11px] text-muted-foreground">Empty</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
