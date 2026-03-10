"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NoteDetail, type NoteDetailData } from "@/components/notes/note-detail";
import { useLocale } from "@/hooks/use-locale";

export const NEW_NOTE_ID = "__new__";

interface NoteViewerProps {
  noteId: string | null;
  activeTag: string | null;
  onDeleted: () => Promise<void> | void;
  onCreated: (id: string) => Promise<void> | void;
  onNotesChanged: () => Promise<void>;
}

function buildDraftNote(): NoteDetailData {
  const now = new Date().toISOString();
  return {
    id: NEW_NOTE_ID,
    title: null,
    tags: null,
    images: null,
    content: "",
    created_at: now,
    updated_at: now,
    subnotes: [],
  };
}

export function NoteViewer(props: NoteViewerProps) {
  const [note, setNote] = useState<NoteDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const noteRef = useRef<NoteDetailData | null>(null);
  const selectedNoteIdRef = useRef<string | null>(props.noteId);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    noteRef.current = note;
  }, [note]);

  useEffect(() => {
    selectedNoteIdRef.current = props.noteId;
  }, [props.noteId]);

  const loadNote = useCallback(async (id: string, options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? true;
    const requestId = ++requestIdRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (showLoading) {
      setLoading(true);
      setNote(null);
    }

    try {
      const res = await fetch(`/api/notes/${id}`, { signal: controller.signal });
      if (!res.ok) {
        if (requestId === requestIdRef.current && selectedNoteIdRef.current === id) {
          setNote(null);
        }
        return;
      }

      const data = await res.json();
      if (controller.signal.aborted) return;
      if (requestId !== requestIdRef.current) return;
      if (selectedNoteIdRef.current !== id) return;

      setNote(data);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (requestId === requestIdRef.current && selectedNoteIdRef.current === id) {
        setNote(null);
      }
      if (error instanceof Error && error.name !== "AbortError") {
        setLoading(false);
      }
    } finally {
      if (requestId === requestIdRef.current && selectedNoteIdRef.current === id) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    abortRef.current?.abort();

    if (!props.noteId) {
      setLoading(false);
      setNote(null);
      return;
    }

    if (props.noteId === NEW_NOTE_ID) {
      setLoading(false);
      setNote(buildDraftNote());
      return;
    }

    void loadNote(props.noteId);
  }, [loadNote, props.noteId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function refreshCurrentNote(targetId: string, options?: { showLoading?: boolean }) {
    if (targetId === NEW_NOTE_ID) return;
    await loadNote(targetId, options);
  }

  async function handleUpdate(data: { title?: string | null; content?: string; tags?: string[] | null }) {
    const currentNote = noteRef.current;
    if (!currentNote) return;

    if (currentNote.id === NEW_NOTE_ID) {
      const nextTitle = data.title !== undefined ? data.title : currentNote.title;
      const nextContent = data.content ?? currentNote.content;
      const nextTags = data.tags !== undefined ? data.tags : currentNote.tags;

      setNote({
        ...currentNote,
        title: nextTitle ?? null,
        content: nextContent,
        tags: nextTags ?? null,
      });

      if (!nextContent.trim() && !nextTitle?.trim()) return;

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: nextContent,
          title: nextTitle || undefined,
          tags: nextTags || undefined,
        }),
      });
      if (!res.ok) return;

      const created = await res.json();
      setLoading(true);
      setNote(null);
      await props.onNotesChanged();
      await props.onCreated(created.id);
      return;
    }

    await fetch(`/api/notes/${currentNote.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await Promise.all([
      props.onNotesChanged(),
      refreshCurrentNote(currentNote.id, { showLoading: false }),
    ]);
  }

  async function handleDelete() {
    const currentNote = noteRef.current;
    if (!currentNote) return;

    if (currentNote.id !== NEW_NOTE_ID) {
      await fetch(`/api/notes/${currentNote.id}`, { method: "DELETE" });
      await props.onNotesChanged();
    }

    setLoading(false);
    setNote(null);
    await props.onDeleted();
  }

  async function handleAddSubnote(content: string) {
    const currentNote = noteRef.current;
    if (!currentNote || currentNote.id === NEW_NOTE_ID) return;

    await fetch(`/api/notes/${currentNote.id}/subnotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await Promise.all([
      props.onNotesChanged(),
      refreshCurrentNote(currentNote.id, { showLoading: false }),
    ]);
  }

  async function handleUpdateSubnote(subnoteId: string, content: string) {
    const currentNote = noteRef.current;
    if (!currentNote || currentNote.id === NEW_NOTE_ID) return;

    await fetch(`/api/notes/${currentNote.id}/subnotes/${subnoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await Promise.all([
      props.onNotesChanged(),
      refreshCurrentNote(currentNote.id, { showLoading: false }),
    ]);
  }

  async function handleDeleteSubnote(subnoteId: string) {
    const currentNote = noteRef.current;
    if (!currentNote || currentNote.id === NEW_NOTE_ID) return;

    await fetch(`/api/notes/${currentNote.id}/subnotes/${subnoteId}`, { method: "DELETE" });
    await Promise.all([
      props.onNotesChanged(),
      refreshCurrentNote(currentNote.id, { showLoading: false }),
    ]);
  }

  async function handleImagesChange(targetNoteId: string, images: string[]) {
    if (selectedNoteIdRef.current !== targetNoteId) return;
    setNote((current) => {
      if (!current || current.id !== targetNoteId) return current;
      return { ...current, images };
    });
    await props.onNotesChanged();
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.notes.loading}</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.notes.selectOrCreate}</p>
      </div>
    );
  }

  return (
    <NoteDetail
      key={note.id}
      note={note}
      onUpdate={handleUpdate}
      onAddSubnote={handleAddSubnote}
      onUpdateSubnote={handleUpdateSubnote}
      onDelete={handleDelete}
      onDeleteSubnote={handleDeleteSubnote}
      onImagesChange={handleImagesChange}
    />
  );
}
