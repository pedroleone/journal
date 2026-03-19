"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/dashboard/top-bar";
import { QuadrantGrid } from "@/components/dashboard/quadrant-grid";
import { QuadrantCard } from "@/components/dashboard/quadrant-card";

function parseDate(param: string | null): Date {
  if (param) {
    const d = new Date(param + "T00:00:00");
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function DashboardHome() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [date, setDate] = useState(() => parseDate(searchParams.get("date")));

  function handleDateChange(newDate: Date) {
    setDate(newDate);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", toDateParam(newDate));
    router.replace(`/?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex h-dvh flex-col">
      <TopBar date={date} onDateChange={handleDateChange} />
      <QuadrantGrid>
        <QuadrantCard domain="journal" label="Journal" href="/journal/browse">
          <p className="text-sm text-muted-foreground">
            Journal quadrant — coming in Phase 2
          </p>
        </QuadrantCard>
        <QuadrantCard domain="food" label="Food" href="/food/browse">
          <p className="text-sm text-muted-foreground">
            Food quadrant — coming in Phase 2
          </p>
        </QuadrantCard>
        <QuadrantCard domain="notes" label="Notes" href="/notes/browse">
          <p className="text-sm text-muted-foreground">
            Notes quadrant — coming in Phase 2
          </p>
        </QuadrantCard>
        <QuadrantCard domain="library" label="Library" href="/library/browse">
          <p className="text-sm text-muted-foreground">
            Library quadrant — coming in Phase 2
          </p>
        </QuadrantCard>
      </QuadrantGrid>
    </div>
  );
}
