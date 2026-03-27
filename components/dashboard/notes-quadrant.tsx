"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { QuadrantCard } from "./quadrant-card";

interface NoteItem {
  id: string;
  title: string | null;
  tags: string[] | null;
}

const DESKTOP_ITEM_LIMIT = 24;
const MOBILE_ITEM_LIMIT = 6;

export function NotesQuadrant() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const limit = isDesktop ? DESKTOP_ITEM_LIMIT : MOBILE_ITEM_LIMIT;

  useEffect(() => {
    fetch(`/api/notes?limit=${limit}`)
      .then((r) => r.json())
      .then((data: NoteItem[]) => setNotes(data))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [limit]);

  const allTags = new Set(notes.flatMap((n) => n.tags ?? []));

  return (
    <QuadrantCard
      domain="notes"
      label="Notes"
      href="/notes/browse"
      actions={
        <>
          <Link
            href="/notes/browse"
            className="rounded bg-[var(--notes-dim)] px-2 py-0.5 text-xs font-medium text-[var(--notes)] hover:bg-[var(--notes)]/25"
          >
            <BookOpen className="mr-1 inline-block h-3 w-3" />
            Browse
          </Link>
          <Link
            href="/notes/browse?new=1"
            className="rounded bg-[var(--notes-dim)] px-2 py-0.5 text-xs font-medium text-[var(--notes)] hover:bg-[var(--notes)]/25"
          >
            <Plus className="mr-1 inline-block h-3 w-3" />
            New
          </Link>
        </>
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
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/browse?id=${encodeURIComponent(note.id)}`}
              className="pointer-events-auto flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-[var(--notes-dim)]/70"
            >
              <span className="flex-1 truncate text-sm">
                {note.title || "Untitled"}
              </span>
              {note.tags?.[0] && (
                <span className="shrink-0 rounded bg-[var(--notes-dim)] px-1.5 py-0.5 text-[10px] text-[var(--notes)]">
                  {note.tags[0]}
                </span>
              )}
            </Link>
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
