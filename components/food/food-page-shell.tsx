"use client";

import { useRef } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { DateNavigator } from "@/components/shared/date-navigator";
import { FoodQuickAdd } from "@/components/food/food-quick-add";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";

interface FoodPageShellProps {
  date: Date;
  inboxCount: number;
  view: "day" | "inbox";
  onDateChange: (date: Date) => void;
  onQuickAddSaved: () => void | Promise<void>;
  onOpenInbox: () => void;
  onOpenDayView: () => void;
  children: React.ReactNode;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date, localeCode: string) {
  return date.toLocaleDateString(localeCode, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function FoodPageShell({
  date,
  inboxCount,
  view,
  onDateChange,
  onQuickAddSaved,
  onOpenInbox,
  onOpenDayView,
  children,
}: FoodPageShellProps) {
  const { t } = useLocale();
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="animate-page min-h-dvh bg-[var(--surface-canvas)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <header className="flex min-h-14 flex-wrap items-center gap-3 border-b border-border/60 bg-[var(--surface-topbar)] px-4 py-3">
          <Link href="/" className="text-sm font-medium text-[var(--food)] hover:opacity-80">
            {t.nav.dashboard}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{t.nav.food}</span>
          <span className="ml-auto text-sm text-muted-foreground">
            {formatDateLabel(date, t.localeCode)}
          </span>
        </header>

        <div className="px-4 py-4">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <DateNavigator date={date} onDateChange={onDateChange} />
            <label className="sr-only" htmlFor="food-date-jump">
              {t.food.jumpToDate}
            </label>
            <input
              ref={dateInputRef}
              id="food-date-jump"
              aria-label={t.food.jumpToDate}
              type="date"
              value={formatDateInput(date)}
              onChange={(event) => {
                const nextDate = parseDateInput(event.target.value);
                if (nextDate) onDateChange(nextDate);
              }}
              className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                if (typeof dateInputRef.current?.showPicker === "function") {
                  dateInputRef.current.showPicker();
                } else {
                  dateInputRef.current?.focus();
                }
              }}
            >
              <CalendarDays className="h-4 w-4" />
              {t.food.selectDate}
            </Button>
            <FoodQuickAdd
              year={date.getFullYear()}
              month={date.getMonth() + 1}
              day={date.getDate()}
              onSaved={onQuickAddSaved}
            />
            <Button variant="outline" size="sm" type="button" onClick={onOpenInbox}>
              {t.food.inbox(inboxCount)}
            </Button>
            {view === "inbox" ? (
              <Button variant="ghost" size="sm" type="button" onClick={onOpenDayView}>
                {t.food.dayView}
              </Button>
            ) : null}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
