"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DateTree } from "@/components/journal/date-tree";
import { EntryViewer } from "@/components/journal/entry-viewer";
import { cn } from "@/lib/utils";

interface DateEntry {
  id: string;
  year: number;
  month: number;
  day: number;
}

export default function BrowsePage() {
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<{
    year: number;
    month: number;
    day: number;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    fetch("/api/entries/dates")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setDates(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  function handleSelectDate(year: number, month: number, day: number) {
    setSelectedDate({ year, month, day });
    if (isMobile) setSidebarOpen(false);
  }

  function handleBack() {
    setSidebarOpen(true);
    setSelectedDate(null);
  }

  const showSidebar = isMobile ? sidebarOpen : true;
  const showContent = isMobile ? !sidebarOpen : true;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {showSidebar && (
        <div
          className={cn(
            "shrink-0 border-r border-border/60",
            isMobile ? "w-full" : "w-72",
          )}
        >
          <DateTree
            dates={dates}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onExport={() => router.push("/export")}
          />
        </div>
      )}

      {showContent && (
        <div className="flex-1 overflow-y-auto">
          {!isOnline && (
            <div className="border-b border-border/60 bg-secondary/60 px-6 py-2 text-sm text-muted-foreground">
              You are offline. Reconnect to load journal dates and entries.
            </div>
          )}
          {isMobile && selectedDate && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-6 pt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {selectedDate ? (
            <EntryViewer
              year={selectedDate.year}
              month={selectedDate.month}
              day={selectedDate.day}
            />
          ) : (
            !isMobile && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {isOnline
                    ? "Select a date to view entries"
                    : "Reconnect to load your journal."}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
