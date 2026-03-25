"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LibraryTypePicker } from "@/components/library/library-type-picker";
import { LibraryDetail, type LibraryDetailData } from "@/components/library/library-detail";
import { useLocale } from "@/hooks/use-locale";
import type { MediaType } from "@/lib/library";

const NEW_ITEM_ID = "__new__";

function buildDraftItem(type: MediaType): LibraryDetailData {
  const now = new Date().toISOString();
  return {
    id: NEW_ITEM_ID,
    type,
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

export default function LibraryNewPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [selectedType, setSelectedType] = useState<MediaType | null>(null);
  const [draft, setDraft] = useState<LibraryDetailData | null>(null);

  function handleTypeSelect(type: MediaType) {
    setSelectedType(type);
    setDraft(buildDraftItem(type));
  }

  async function handleUpdate(data: Record<string, unknown>) {
    if (!draft) return;
    setDraft((current) => current ? { ...current, ...data } as LibraryDetailData : current);
  }

  async function handleCreate(data: Record<string, unknown>) {
    if (!draft) return;

    const payload: Record<string, unknown> = {
      type: draft.type,
      status: draft.status,
      rating: draft.rating,
      reactions: draft.reactions,
      genres: draft.genres,
      metadata: draft.metadata,
      content: draft.content,
      ...data,
    };

    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    if (!title) return;
    payload.title = title;

    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;

    const created = await res.json();
    router.push(`/library/${created.id}`);
  }

  async function handleDelete() {
    router.push("/library/browse");
  }

  // Stub handlers — not applicable for new items
  async function noop() {}

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-3">
        <button
          onClick={() => router.push("/library/browse")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.library.back}
        </button>
      </div>

      <div className="flex-1">
        {selectedType === null ? (
          <LibraryTypePicker onSelect={handleTypeSelect} />
        ) : draft ? (
          <LibraryDetail
            key={draft.type}
            item={draft}
            coverUploadDisabled
            onUpdate={handleUpdate}
            onCreate={handleCreate}
            onAddNote={noop}
            onUpdateNote={noop}
            onDelete={handleDelete}
            onDeleteNote={noop}
          />
        ) : null}
      </div>
    </div>
  );
}
