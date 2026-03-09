"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NoteList, type NoteListItem } from "@/components/notes/note-list";
import { NoteDetail, type NoteDetailData } from "@/components/notes/note-detail";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";


export default function NotesBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteDetailData | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const NEW_NOTE_ID = "__new__";

  const loadNotes = useCallback(async (tag?: string | null) => {
    const url = tag ? `/api/notes?tag=${encodeURIComponent(tag)}` : "/api/notes";
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    setNotes(data);
  }, []);

  const loadNote = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedNote(data);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Silent refresh — no loading flash, used after saves/updates
  const refreshNote = useCallback(async (id: string) => {
    const res = await fetch(`/api/notes/${id}`);
    if (!res.ok) return;
    setSelectedNote(await res.json());
  }, []);

  useEffect(() => {
    loadNotes(activeTag);
  }, [activeTag, loadNotes]);

  const isNewMode = searchParams.get("new") === "1";

  useEffect(() => {
    if (isNewMode) {
      void handleNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewMode]);

  function handleSelectNote(id: string) {
    if (id === NEW_NOTE_ID) return;
    setSelectedNoteId(id);
    loadNote(id);
    if (isMobile) setSidebarOpen(false);
    if (searchParams.get("new")) router.replace("/notes/browse");
  }

  function handleTagFilter(tag: string | null) {
    setActiveTag(tag);
    loadNotes(tag);
  }

  function handleNew() {
    router.replace("/notes/browse");
    const now = new Date().toISOString();
    setSelectedNoteId(NEW_NOTE_ID);
    setSelectedNote({ id: NEW_NOTE_ID, title: null, tags: null, images: null, content: "", created_at: now, updated_at: now, subnotes: [] });
    if (isMobile) setSidebarOpen(false);
  }

  async function handleUpdate(data: { title?: string | null; content?: string; tags?: string[] | null }) {
    if (!selectedNoteId) return;

    if (selectedNoteId === NEW_NOTE_ID) {
      // Track accumulated state locally before the note exists on the server
      setSelectedNote((prev) => (prev ? { ...prev, ...data } : prev));
      // Only create once there's actual content or a title
      const content = data.content ?? selectedNote?.content ?? "";
      const title = data.title !== undefined ? data.title : selectedNote?.title ?? null;
      if (!content.trim() && !title?.trim()) return;
      const tags = data.tags !== undefined ? data.tags : selectedNote?.tags ?? null;
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title: title || undefined, tags: tags || undefined }),
      });
      if (!res.ok) return;
      const created = await res.json();
      setSelectedNoteId(created.id);
      await Promise.all([loadNotes(activeTag), refreshNote(created.id)]);
      return;
    }

    await fetch(`/api/notes/${selectedNoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSelectedNote((prev) => (prev ? { ...prev, ...data } : prev));
    void loadNotes(activeTag);
  }

  async function handleDelete() {
    if (!selectedNoteId) return;
    await fetch(`/api/notes/${selectedNoteId}`, { method: "DELETE" });
    setSelectedNoteId(null);
    setSelectedNote(null);
    await loadNotes(activeTag);
    if (isMobile) setSidebarOpen(true);
  }

  async function handleAddSubnote(content: string) {
    if (!selectedNoteId) return;
    await fetch(`/api/notes/${selectedNoteId}/subnotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await refreshNote(selectedNoteId);
  }

  async function handleUpdateSubnote(subnoteId: string, content: string) {
    if (!selectedNoteId) return;
    await fetch(`/api/notes/${selectedNoteId}/subnotes/${subnoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await refreshNote(selectedNoteId);
  }

  function handleImagesChange(images: string[]) {
    setSelectedNote((prev) => (prev ? { ...prev, images } : prev));
  }

  async function handleDeleteSubnote(subnoteId: string) {
    if (!selectedNoteId) return;
    await fetch(`/api/notes/${selectedNoteId}/subnotes/${subnoteId}`, { method: "DELETE" });
    await refreshNote(selectedNoteId);
  }

  const showSidebar = isMobile ? sidebarOpen : true;
  const showContent = isMobile ? !sidebarOpen : true;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {showSidebar && (
        <div className={cn("border-r border-border/60", isMobile ? "w-full" : "w-72")}>
          <NoteList
            notes={notes}
            selectedId={selectedNoteId}
            activeTag={activeTag}
            onSelect={handleSelectNote}
            onTagFilter={handleTagFilter}
            onNew={handleNew}
          />
        </div>
      )}

      {showContent && (
        <div className="flex-1 overflow-y-auto">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-6 pt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {loadingDetail ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : selectedNote ? (
            <NoteDetail
              key={selectedNote.id}
              note={selectedNote}
              onUpdate={handleUpdate}
              onAddSubnote={handleAddSubnote}
              onUpdateSubnote={handleUpdateSubnote}
              onDelete={handleDelete}
              onDeleteSubnote={handleDeleteSubnote}
              onImagesChange={handleImagesChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a note or create a new one.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
