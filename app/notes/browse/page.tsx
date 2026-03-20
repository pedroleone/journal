"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NoteList, type NoteListItem } from "@/components/notes/note-list";
import { NEW_NOTE_ID, NoteViewer } from "@/components/notes/note-viewer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { useLocale } from "@/hooks/use-locale";

export default function NotesBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useLocale();

  const loadNotes = useCallback(async (tag?: string | null) => {
    const url = tag ? `/api/notes?tag=${encodeURIComponent(tag)}` : "/api/notes";
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    setNotes(data);
  }, []);

  useEffect(() => {
    loadNotes(activeTag);
  }, [activeTag, loadNotes]);

  const isNewMode = searchParams.get("new") === "1";
  const requestedNoteId = searchParams.get("id");

  useEffect(() => {
    if (isNewMode) {
      void handleNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewMode]);

  useEffect(() => {
    if (!requestedNoteId || isNewMode) return;
    setSelectedNoteId(requestedNoteId);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, isNewMode, requestedNoteId]);

  function handleSelectNote(id: string) {
    if (id === NEW_NOTE_ID) return;
    setSelectedNoteId(id);
    if (isMobile) setSidebarOpen(false);
    if (searchParams.get("new") || searchParams.get("id")) router.replace("/notes/browse");
  }

  function handleTagFilter(tag: string | null) {
    setActiveTag(tag);
  }

  function handleNew() {
    router.replace("/notes/browse");
    setSelectedNoteId(NEW_NOTE_ID);
    if (isMobile) setSidebarOpen(false);
  }

  const showContent = isMobile ? !sidebarOpen : true;

  return (
    <div className="flex h-full">
      <CollapsibleSidebar visible={sidebarOpen}>
        <NoteList
          notes={notes}
          selectedId={selectedNoteId}
          activeTag={activeTag}
          onSelect={handleSelectNote}
          onTagFilter={handleTagFilter}
          onNew={handleNew}
        />
      </CollapsibleSidebar>

      {showContent && (
        <div className="flex-1 overflow-y-auto scrollbar-gutter-stable">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-6 pt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.notes.back}
            </button>
          )}
          <NoteViewer
            noteId={selectedNoteId}
            activeTag={activeTag}
            onDeleted={() => {
              setSelectedNoteId(null);
              if (isMobile) setSidebarOpen(true);
            }}
            onCreated={(id) => {
              setSelectedNoteId(id);
            }}
            onNotesChanged={() => loadNotes(activeTag)}
          />
        </div>
      )}
    </div>
  );
}
