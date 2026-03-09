"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLocale } from "@/hooks/use-locale";
import { DateTree, type DateSelection } from "@/components/journal/date-tree";
import { EntryViewer } from "@/components/journal/entry-viewer";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";

interface DateEntry {
  id: string;
  year: number;
  month: number;
  day: number;
}

export default function BrowsePage() {
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [selected, setSelected] = useState<DateSelection | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isOnline = useOnlineStatus();
  const { t } = useLocale();

  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    fetch("/api/entries/dates")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;

        setDates(data);
        setSelected((current) => {
          if (current || data.length === 0) return current;

          const [latestEntry] = data;
          if (isMobile) setSidebarOpen(false);

          return {
            year: latestEntry.year,
            month: latestEntry.month,
            day: latestEntry.day,
          };
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isMobile, isOnline]);

  function handleSelect(sel: DateSelection) {
    setSelected(sel);
    if (isMobile) setSidebarOpen(false);
  }

  function handleBack() {
    setSidebarOpen(true);
    setSelected(null);
  }

  const showContent = isMobile ? !sidebarOpen : true;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <CollapsibleSidebar visible={sidebarOpen}>
        <DateTree
          dates={dates}
          selected={selected}
          onSelect={handleSelect}
          onExport={() => router.push("/export")}
        />
      </CollapsibleSidebar>

      {showContent && (
        <div className="flex-1 overflow-y-auto">
          {!isOnline && (
            <div className="border-b border-border/60 bg-secondary/60 px-6 py-2 text-sm text-muted-foreground">
              {t.journal.offlineBrowse}
            </div>
          )}
          {isMobile && selected && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-6 pt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.journal.back}
            </button>
          )}

          {selected ? (
            <EntryViewer
              year={selected.year}
              month={selected.month}
              day={selected.day}
            />
          ) : (
            !isMobile && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {isOnline
                    ? t.journal.selectDate
                    : t.journal.reconnectToLoad}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
