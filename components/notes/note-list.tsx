"use client";

import { useMemo, useState } from "react";
import { Search, X, Tag, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { formatRelativeDate } from "@/lib/i18n";

export interface NoteListItem {
  id: string;
  title: string | null;
  tags: string[] | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

interface NoteListProps {
  notes: NoteListItem[];
  selectedId: string | null;
  activeTag: string | null;
  onSelect: (id: string) => void;
  onTagFilter: (tag: string | null) => void;
  onNew: () => void;
}

function formatNoteDate(iso: string, localeCode: string): string {
  return new Date(iso).toLocaleDateString(localeCode, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNoteLabel(note: NoteListItem, localeCode: string): string {
  return note.title?.trim() || formatNoteDate(note.created_at, localeCode);
}

export function NoteList({ notes, selectedId, activeTag, onSelect, onTagFilter, onNew }: NoteListProps) {
  const [query, setQuery] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const { t } = useLocale();
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags ?? []))).sort();

  const visibleNotes = useMemo(() => {
    if (!query.trim()) return notes;
    const q = query.toLowerCase();
    return notes.filter(
      (n) =>
        (n.title ?? "").toLowerCase().includes(q) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [notes, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative border-b border-border/60 px-3 py-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          className="w-full bg-transparent pl-6 pr-6 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
          placeholder={t.notes.searchNotes}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="border-b border-border/60 px-3 py-2">
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-secondary/50",
              activeTag ? "text-foreground font-medium" : "text-muted-foreground",
            )}>
              <Tag className="h-3 w-3" />
              <span>{activeTag ?? t.notes.allTags}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={4} className="w-48 p-1">
              <button
                onClick={() => { onTagFilter(null); setTagPopoverOpen(false); }}
                className="flex w-full items-center justify-between rounded-sm px-3 py-1.5 text-sm hover:bg-secondary"
              >
                <span>{t.notes.allTags}</span>
                {activeTag === null && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => { onTagFilter(activeTag === tag ? null : tag); setTagPopoverOpen(false); }}
                  className="flex w-full items-center justify-between rounded-sm px-3 py-1.5 text-sm hover:bg-secondary"
                >
                  <span>{tag}</span>
                  {activeTag === tag && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {visibleNotes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {query ? t.notes.noNotesMatchSearch : t.notes.noNotesYet}
          </p>
        ) : (
          visibleNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelect(note.id)}
              className={cn(
                "w-full border-b border-border/40 px-3 py-3 text-left transition-colors",
                selectedId === note.id
                  ? "bg-secondary"
                  : "hover:bg-secondary/50",
              )}
            >
              <p className={cn("truncate text-sm", selectedId === note.id ? "font-medium" : "")}>
                {getNoteLabel(note, t.localeCode)}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeDate(note.updated_at, t.localeCode)}
                </span>
                {(note.tags ?? []).map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="border-t border-border/60 p-3">
        <button
          onClick={onNew}
          className="w-full rounded-md py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50"
        >
          {t.notes.newNote}
        </button>
      </div>
    </div>
  );
}
