"use client";

import { Archive, X } from "lucide-react";
import { DateTree, type DateSelection } from "@/components/journal/date-tree";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface DateEntry {
  id: string;
  year: number;
  month: number;
  day: number;
}

interface JournalArchivePanelProps {
  open: boolean;
  isMobile: boolean;
  dates: DateEntry[];
  selected: DateSelection | null;
  onSelect: (selection: DateSelection) => void;
  onClose: () => void;
  onExport: () => void;
}

function ArchiveBody({
  dates,
  selected,
  onSelect,
  onClose,
  onExport,
}: Omit<JournalArchivePanelProps, "open" | "isMobile">) {
  return (
    <div
      data-testid="journal-archive-panel"
      className="flex h-full flex-col overflow-hidden border-r border-border/60 bg-[var(--surface-panel)]"
    >
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-[var(--journal)]" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Archive
            </p>
            <p className="text-sm text-foreground">Browse older entries</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border/60 p-1.5 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          aria-label="Close archive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <DateTree
        dates={dates}
        selected={selected}
        onSelect={onSelect}
        onExport={onExport}
        variant="archive"
      />
    </div>
  );
}

export function JournalArchivePanel({
  open,
  isMobile,
  dates,
  selected,
  onSelect,
  onClose,
  onExport,
}: JournalArchivePanelProps) {
  if (!open) return null;

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="left-0 top-0 h-dvh max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">Archive</DialogTitle>
          <DialogDescription className="sr-only">
            Browse journal entries by date.
          </DialogDescription>
          <ArchiveBody
            dates={dates}
            selected={selected}
            onSelect={onSelect}
            onClose={onClose}
            onExport={onExport}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <aside className="absolute inset-y-0 left-0 z-20 w-80 shadow-2xl">
      <ArchiveBody
        dates={dates}
        selected={selected}
        onSelect={onSelect}
        onClose={onClose}
        onExport={onExport}
      />
    </aside>
  );
}
