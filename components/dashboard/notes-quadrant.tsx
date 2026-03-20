"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { QuadrantCard } from "./quadrant-card";

interface NoteItem {
  id: string;
  title: string | null;
  tags: string[] | null;
}

export function NotesQuadrant() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((data: NoteItem[]) => setNotes(data))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  const allTags = new Set(notes.flatMap((n) => n.tags ?? []));

  return (
    <QuadrantCard
      domain="notes"
      label="Notes"
      href="/notes/browse"
      actions={
        <Link
          href="/notes/browse?new=1"
          className="rounded bg-[var(--notes-dim)] px-2 py-0.5 text-xs font-medium text-[var(--notes)] hover:bg-[var(--notes)]/25"
        >
          <Plus className="mr-1 inline-block h-3 w-3" />
          New
        </Link>
      }
      footer={
        <>
          <span>{notes.length} notes</span>
          <span>{allTags.size} tags</span>
        </>
      }
    >
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-muted/30" />
          ))}
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-1.5">
          {notes.slice(0, 3).map((note) => (
            <div key={note.id} className="flex items-center gap-2">
              <span className="flex-1 truncate text-sm">
                {note.title || "Untitled"}
              </span>
              {note.tags?.[0] && (
                <span className="shrink-0 rounded bg-[var(--notes-dim)] px-1.5 py-0.5 text-[10px] text-[var(--notes)]">
                  {note.tags[0]}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No notes yet
        </p>
      )}
    </QuadrantCard>
  );
}
