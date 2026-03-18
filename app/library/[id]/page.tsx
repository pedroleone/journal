"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LibraryDetail, type LibraryDetailData } from "@/components/library/library-detail";
import { useLocale } from "@/hooks/use-locale";

export default function LibraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLocale();
  const itemId = params.id as string;

  const [item, setItem] = useState<LibraryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const itemRef = useRef<LibraryDetailData | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { itemRef.current = item; }, [item]);

  const loadItem = useCallback(async (id: string, options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? true;

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
        if (!controller.signal.aborted) setItem(null);
        return;
      }
      const data = await res.json();
      if (!controller.signal.aborted) setItem(data);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setItem(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItem(itemId);
    return () => { abortRef.current?.abort(); };
  }, [itemId, loadItem]);

  async function refreshCurrent(options?: { showLoading?: boolean }) {
    await loadItem(itemId, options);
  }

  async function handleUpdate(data: Record<string, unknown>) {
    const current = itemRef.current;
    if (!current) return;

    // Optimistic update
    setItem((prev) => prev ? { ...prev, ...data } as LibraryDetailData : prev);

    await fetch(`/api/library/${current.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await refreshCurrent({ showLoading: false });
  }

  async function handleDelete() {
    const current = itemRef.current;
    if (!current) return;
    await fetch(`/api/library/${current.id}`, { method: "DELETE" });
    router.push("/library/browse");
  }

  async function handleAddNote(content: string) {
    const current = itemRef.current;
    if (!current) return;
    await fetch(`/api/library/${current.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await refreshCurrent({ showLoading: false });
  }

  async function handleUpdateNote(noteId: string, content: string) {
    const current = itemRef.current;
    if (!current) return;
    await fetch(`/api/library/${current.id}/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await refreshCurrent({ showLoading: false });
  }

  async function handleDeleteNote(noteId: string) {
    const current = itemRef.current;
    if (!current) return;
    await fetch(`/api/library/${current.id}/notes/${noteId}`, { method: "DELETE" });
    await refreshCurrent({ showLoading: false });
  }

  async function handleUploadCover(file: File) {
    const current = itemRef.current;
    if (!current) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/library/${current.id}/cover`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return;
    await refreshCurrent({ showLoading: false });
  }

  async function handleDeleteCover() {
    const current = itemRef.current;
    if (!current) return;
    await fetch(`/api/library/${current.id}/cover`, { method: "DELETE" });
    await refreshCurrent({ showLoading: false });
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Back button */}
      <div className="px-6 pt-3">
        <button
          onClick={() => router.push("/library/browse")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.library.back}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">{t.library.loading}</p>
          </div>
        ) : !item ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Item not found.</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
