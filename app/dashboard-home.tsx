"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/dashboard/top-bar";
import { QuadrantGrid } from "@/components/dashboard/quadrant-grid";
import { JournalQuadrant } from "@/components/dashboard/journal-quadrant";
import { FoodQuadrant } from "@/components/dashboard/food-quadrant";
import { NotesQuadrant } from "@/components/dashboard/notes-quadrant";
import { LibraryQuadrant } from "@/components/dashboard/library-quadrant";

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
        <JournalQuadrant date={date} />
        <FoodQuadrant date={date} />
        <NotesQuadrant />
        <LibraryQuadrant />
      </QuadrantGrid>
    </div>
  );
}
