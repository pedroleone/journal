"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLocale } from "@/hooks/use-locale";

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShort(date: Date, localeCode: string): string {
  return date.toLocaleDateString(localeCode, { month: "short", day: "numeric" });
}

function formatFull(date: Date, localeCode: string): string {
  return date.toLocaleDateString(localeCode, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { t } = useLocale();
  const prev = addDays(date, -1);
  const next = addDays(date, 1);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onDateChange(prev)}
        className="rounded p-1 hover:bg-accent"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {isDesktop && (
        <button
          onClick={() => onDateChange(prev)}
          className="text-xs text-muted-foreground hover:text-foreground px-1"
        >
          {formatShort(prev, t.localeCode)}
        </button>
      )}

      <span className="px-2 text-sm font-medium">{formatFull(date, t.localeCode)}</span>

      {isDesktop && (
        <button
          onClick={() => onDateChange(next)}
          className="text-xs text-muted-foreground hover:text-foreground px-1"
        >
          {formatShort(next, t.localeCode)}
        </button>
      )}

      <button
        onClick={() => onDateChange(next)}
        className="rounded p-1 hover:bg-accent"
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
