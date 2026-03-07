"use client";

import { cn } from "@/lib/utils";

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

function formatNoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNoteLabel(note: NoteListItem): string {
  return note.title?.trim() || formatNoteDate(note.created_at);
}

export function NoteList({ notes, selectedId, activeTag, onSelect, onTagFilter, onNew }: NoteListProps) {
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags ?? []))).sort();

  return (
    <div className="flex h-full flex-col">
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 border-b border-border/60 p-3">
          <button
            onClick={() => onTagFilter(null)}
            className={cn(
              "rounded-full px-2 py-0.5 text-xs transition-colors",
              activeTag === null
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagFilter(activeTag === tag ? null : tag)}
              className={cn(
                "rounded-full px-2 py-0.5 text-xs transition-colors",
                activeTag === tag
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          notes.map((note) => (
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
                {getNoteLabel(note)}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {formatNoteDate(note.updated_at)}
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
          + New Note
        </button>
      </div>
    </div>
  );
}
