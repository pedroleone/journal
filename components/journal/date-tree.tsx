"use client";

import { useMemo } from "react";
import { ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DateEntry {
  id: string;
  year: number;
  month: number;
  day: number;
}

export interface DateSelection {
  year: number;
  month?: number;
  day?: number;
}

interface DateTreeProps {
  dates: DateEntry[];
  selected: DateSelection | null;
  onSelect: (sel: DateSelection) => void;
  onExport: () => void;
  variant?: "sidebar" | "archive";
}

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

function getDayOfWeek(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return DAY_NAMES[date.getDay()];
}

interface YearGroup {
  year: number;
  months: MonthGroup[];
}

interface MonthGroup {
  month: number;
  days: { day: number; ids: string[] }[];
}

function buildTree(dates: DateEntry[]): YearGroup[] {
  const yearMap = new Map<number, Map<number, Map<number, string[]>>>();

  for (const d of dates) {
    if (!yearMap.has(d.year)) yearMap.set(d.year, new Map());
    const monthMap = yearMap.get(d.year)!;
    if (!monthMap.has(d.month)) monthMap.set(d.month, new Map());
    const dayMap = monthMap.get(d.month)!;
    if (!dayMap.has(d.day)) dayMap.set(d.day, []);
    dayMap.get(d.day)!.push(d.id);
  }

  const years: YearGroup[] = [];
  for (const [year, monthMap] of [...yearMap.entries()].sort(
    (a, b) => b[0] - a[0],
  )) {
    const months: MonthGroup[] = [];
    for (const [month, dayMap] of [...monthMap.entries()].sort(
      (a, b) => b[0] - a[0],
    )) {
      const days = [...dayMap.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([day, ids]) => ({ day, ids }));
      months.push({ month, days });
    }
    years.push({ year, months });
  }

  return years;
}

export function DateTree({
  dates,
  selected,
  onSelect,
  onExport,
  variant = "sidebar",
}: DateTreeProps) {
  const tree = useMemo(() => buildTree(dates), [dates]);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isArchive = variant === "archive";

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className={cn("space-y-1", isArchive ? "p-4" : "p-3")}>
          {tree.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              No entries yet
            </p>
          )}
          {tree.map((yearGroup) => {
            const yearActive =
              selected?.year === yearGroup.year && selected?.month == null;
            return (
              <Collapsible
                key={yearGroup.year}
                defaultOpen={yearGroup.year === currentYear}
              >
                <div className="flex items-center">
                  <button
                    onClick={() => onSelect({ year: yearGroup.year })}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1.5 text-left font-medium uppercase tracking-wider transition-colors",
                      isArchive ? "text-[11px]" : "text-xs",
                      yearActive
                        ? "bg-secondary font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {yearGroup.year}
                  </button>
                  <CollapsibleTrigger asChild>
                    <button className="group rounded-md p-1 text-muted-foreground hover:text-foreground">
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="ml-2 space-y-0.5">
                    {yearGroup.months.map((monthGroup) => {
                      const monthActive =
                        selected?.year === yearGroup.year &&
                        selected?.month === monthGroup.month &&
                        selected?.day == null;
                      return (
                        <Collapsible
                          key={monthGroup.month}
                          defaultOpen={
                            yearGroup.year === currentYear &&
                            monthGroup.month === currentMonth
                          }
                        >
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                onSelect({
                                  year: yearGroup.year,
                                  month: monthGroup.month,
                                })
                              }
                              className={cn(
                                "flex-1 rounded-md px-2 py-1 text-left text-sm transition-colors",
                                monthActive
                                  ? "bg-secondary font-medium text-foreground"
                                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
                              )}
                            >
                              {MONTH_NAMES[monthGroup.month]}
                            </button>
                            <CollapsibleTrigger asChild>
                              <button className="group rounded-md p-1 text-muted-foreground hover:text-foreground">
                                <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                              </button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="ml-4 space-y-0.5 py-0.5">
                              {monthGroup.days.map(({ day }) => {
                                const isActive =
                                  selected?.year === yearGroup.year &&
                                  selected?.month === monthGroup.month &&
                                  selected?.day === day;
                                return (
                                  <button
                                    key={day}
                                    onClick={() =>
                                      onSelect({
                                        year: yearGroup.year,
                                        month: monthGroup.month,
                                        day,
                                      })
                                    }
                                    className={cn(
                                      "flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                                      isActive
                                        ? "bg-secondary font-medium text-foreground"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                                    )}
                                  >
                                    {getDayOfWeek(
                                      yearGroup.year,
                                      monthGroup.month,
                                      day,
                                    )}
                                    , {String(day).padStart(2, "0")}/
                                    {String(monthGroup.month).padStart(2, "0")}
                                  </button>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
      <div className={cn("border-t border-border/60", isArchive ? "p-4" : "p-3")}>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
