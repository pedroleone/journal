"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LibraryDetail, type LibraryDetailData } from "@/components/library/library-detail";
import { useLocale } from "@/hooks/use-locale";
export const NEW_ITEM_ID = "__new__";

interface LibraryViewerProps {
  itemId: string | null;
  onDeleted: () => Promise<void> | void;
  onCreated: (id: string) => Promise<void> | void;
  onItemsChanged: () => Promise<void>;
}

function buildDraftItem(): LibraryDetailData {
  const now = new Date().toISOString();
  return {
    id: NEW_ITEM_ID,
    type: "book",
    title: "",
    creator: null,
    url: null,
    status: "backlog",
    rating: null,
    reactions: null,
    genres: null,
    metadata: null,
    cover_image: null,
    content: null,
    added_at: now,
    started_at: null,
    finished_at: null,
    created_at: now,
    updated_at: now,
    notes: [],
  };
}

export function LibraryViewer(props: LibraryViewerProps) {
  const [item, setItem] = useState<LibraryDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const itemRef = useRef<LibraryDetailData | null>(null);
  const selectedIdRef = useRef<string | null>(props.itemId);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const { t } = useLocale();

  useEffect(() => { itemRef.current = item; }, [item]);
  useEffect(() => { selectedIdRef.current = props.itemId; }, [props.itemId]);

  const loadItem = useCallback(async (id: string, options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? true;
    const requestId = ++requestIdRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (showLoading) {
      setLoading(true);
      setItem(null);
    }

    try {
      const res = await fetch(`/api/library/${id}`, { signal: controller.signal });
      if (!res.ok) {
        if (requestId === requestIdRef.current && selectedIdRef.current === id) setItem(null);
        return;
      }

      const data = await res.json();
      if (controller.signal.aborted) return;
      if (requestId !== requestIdRef.current) return;
      if (selectedIdRef.current !== id) return;

      setItem(data);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (requestId === requestIdRef.current && selectedIdRef.current === id) setItem(null);
      if (error instanceof Error && error.name !== "AbortError") setLoading(false);
    } finally {
      if (requestId === requestIdRef.current && selectedIdRef.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    if (!props.itemId) { setLoading(false); setItem(null); return; }
    if (props.itemId === NEW_ITEM_ID) { setLoading(false); setItem(buildDraftItem()); return; }
    void loadItem(props.itemId);
  }, [loadItem, props.itemId]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  async function refreshCurrent(targetId: string, options?: { showLoading?: boolean }) {
    if (targetId === NEW_ITEM_ID) return;
    await loadItem(targetId, options);
  }

  async function handleUpdate(data: Record<string, unknown>) {
    const current = itemRef.current;
    if (!current) return;

    if (current.id === NEW_ITEM_ID) {
      const next = { ...current, ...data } as LibraryDetailData;
      setItem(next);

      if (!next.title.trim()) return;

      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: next.type,
          title: next.title,
          creator: next.creator || undefined,
          url: next.url || undefined,
          status: next.status,
          rating: next.rating || undefined,
          reactions: next.reactions || undefined,
          genres: next.genres || undefined,
          metadata: next.metadata || undefined,
          content: next.content || undefined,
        }),
      });
      if (!res.ok) return;

      const created = await res.json();
      setLoading(true);
      setItem(null);
      await props.onItemsChanged();
      await props.onCreated(created.id);
      return;
    }

    // Optimistic update
    setItem((prev) => prev ? { ...prev, ...data } as LibraryDetailData : prev);

    await fetch(`/api/library/${current.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await Promise.all([
      props.onItemsChanged(),
      refreshCurrent(current.id, { showLoading: false }),
    ]);
  }

  async function handleDelete() {
    const current = itemRef.current;
    if (!current) return;

    if (current.id !== NEW_ITEM_ID) {
      await fetch(`/api/library/${current.id}`, { method: "DELETE" });
      await props.onItemsChanged();
    }

    setLoading(false);
    setItem(null);
    await props.onDeleted();
  }

  async function handleAddNote(content: string) {
    const current = itemRef.current;
    if (!current || current.id === NEW_ITEM_ID) return;

    await fetch(`/api/library/${current.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await Promise.all([
      props.onItemsChanged(),
      refreshCurrent(current.id, { showLoading: false }),
    ]);
  }

  async function handleUpdateNote(noteId: string, content: string) {
    const current = itemRef.current;
    if (!current || current.id === NEW_ITEM_ID) return;

    await fetch(`/api/library/${current.id}/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await Promise.all([
      props.onItemsChanged(),
      refreshCurrent(current.id, { showLoading: false }),
    ]);
  }

  async function handleDeleteNote(noteId: string) {
    const current = itemRef.current;
    if (!current || current.id === NEW_ITEM_ID) return;

    await fetch(`/api/library/${current.id}/notes/${noteId}`, { method: "DELETE" });
    await Promise.all([
      props.onItemsChanged(),
      refreshCurrent(current.id, { showLoading: false }),
    ]);
  }

  async function handleUploadCover(file: File) {
    const current = itemRef.current;
    if (!current || current.id === NEW_ITEM_ID) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/library/${current.id}/cover`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return;

    await Promise.all([
      props.onItemsChanged(),
      refreshCurrent(current.id, { showLoading: false }),
    ]);
  }

  async function handleDeleteCover() {
    const current = itemRef.current;
    if (!current || current.id === NEW_ITEM_ID) return;

    await fetch(`/api/library/${current.id}/cover`, { method: "DELETE" });
    await Promise.all([
      props.onItemsChanged(),
      refreshCurrent(current.id, { showLoading: false }),
    ]);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.library.loading}</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{t.library.selectOrCreate}</p>
      </div>
    );
  }

  return (
    <LibraryDetail
      key={item.id}
      item={item}
      onUpdate={handleUpdate}
      onAddNote={handleAddNote}
      onUpdateNote={handleUpdateNote}
      onDelete={handleDelete}
      onDeleteNote={handleDeleteNote}
      onUploadCover={handleUploadCover}
      onDeleteCover={handleDeleteCover}
    />
  );
}
