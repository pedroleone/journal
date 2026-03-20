"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLocale } from "@/hooks/use-locale";
import { EntryViewer } from "@/components/journal/entry-viewer";
import { type DateSelection } from "@/components/journal/date-tree";
import { JournalArchivePanel } from "@/components/journal/journal-archive-panel";

interface DateEntry {
  id: string;
  year: number;
  month: number;
  day: number;
}

function parseSelectedDate(searchParams: URLSearchParams): DateSelection | null {
  const dateParam = searchParams.get("date");
  if (dateParam) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }
  }

  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  const day = Number(searchParams.get("day"));
  if (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    year > 0 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  ) {
    return { year, month, day };
  }

  return null;
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const explicitSelection = parseSelectedDate(searchParams);
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [selected, setSelected] = useState<DateSelection | null>(explicitSelection);
  const [archiveOpen, setArchiveOpen] = useState(false);
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
  }, [explicitSelection, isMobile, isOnline]);

  useEffect(() => {
    if (!explicitSelection) return;
    setSelected(explicitSelection);
  }, [explicitSelection]);

  function handleSelect(sel: DateSelection) {
    setSelected(sel);
    if (isMobile) setArchiveOpen(false);
  }

  return (
    <div className="relative flex h-full min-h-0 bg-background">
      <JournalArchivePanel
        open={archiveOpen}
        isMobile={isMobile}
        dates={dates}
        selected={selected}
        onSelect={handleSelect}
        onClose={() => setArchiveOpen(false)}
        onExport={() => router.push("/settings")}
      />

      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-12 pt-6 sm:px-6">
          <div className="mb-6 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setArchiveOpen((current) => !current)}
              aria-pressed={archiveOpen}
              className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-secondary/35 px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary/60"
            >
              <Archive className="h-4 w-4 text-[var(--journal)]" />
              Archive
            </button>
          </div>

          {!isOnline && (
            <div className="mb-4 rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
              {t.journal.offlineBrowse}
            </div>
          )}

          {selected ? (
            <EntryViewer
              year={selected.year}
              month={selected.month}
              day={selected.day}
            />
          ) : (
            <div className="flex min-h-[50vh] items-center justify-center rounded-[28px] border border-border/60 bg-card/40 px-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isOnline
                  ? t.journal.selectDate
                  : t.journal.reconnectToLoad}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
