"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NoteList, type NoteListItem } from "@/components/notes/note-list";
import { NoteDetail, type NoteDetailData } from "@/components/notes/note-detail";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface NewNoteFormProps {
  onCreated: (id: string) => void;
  onCancel: () => void;
}

function NewNoteForm({ onCreated, onCancel }: NewNoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  }

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: content.trim(),
          tags: tags.length > 0 ? tags : null,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      onCreated(data.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8 space-y-4">
      <h2 className="font-display text-2xl tracking-tight">New Note</h2>
      <input
        className="w-full bg-transparent text-lg focus:outline-none placeholder:text-muted-foreground border-b border-border/60 pb-2"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {tag}
            <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="hover:text-foreground">×</button>
          </span>
        ))}
        <input
          className="bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none min-w-[80px]"
          placeholder="Add tag..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
        />
      </div>
      <textarea
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[200px]"
        placeholder="Write your note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

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
  const [creatingNew, setCreatingNew] = useState(false);

  const isNewMode = searchParams.get("new") === "1";

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

  useEffect(() => {
    loadNotes(activeTag);
  }, [activeTag, loadNotes]);

  useEffect(() => {
    if (isNewMode) {
      setCreatingNew(true);
      setSelectedNoteId(null);
      setSelectedNote(null);
    }
  }, [isNewMode]);

  function handleSelectNote(id: string) {
    setSelectedNoteId(id);
    setCreatingNew(false);
    loadNote(id);
    if (isMobile) setSidebarOpen(false);
    // Clear ?new=1 from URL
    if (searchParams.get("new")) router.replace("/notes/browse");
  }

  function handleTagFilter(tag: string | null) {
    setActiveTag(tag);
    loadNotes(tag);
  }

  function handleNew() {
    setCreatingNew(true);
    setSelectedNoteId(null);
    setSelectedNote(null);
    if (isMobile) setSidebarOpen(false);
    router.replace("/notes/browse?new=1");
  }

  async function handleNoteCreated(id: string) {
    router.replace("/notes/browse");
    await loadNotes(activeTag);
    setCreatingNew(false);
    handleSelectNote(id);
  }

  async function handleUpdate(data: { title?: string | null; content?: string; tags?: string[] | null }) {
    if (!selectedNoteId) return;
    await fetch(`/api/notes/${selectedNoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await Promise.all([loadNotes(activeTag), loadNote(selectedNoteId)]);
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
    await loadNote(selectedNoteId);
  }

  async function handleUpdateSubnote(subnoteId: string, content: string) {
    if (!selectedNoteId) return;
    await fetch(`/api/notes/${selectedNoteId}/subnotes/${subnoteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    await loadNote(selectedNoteId);
  }

  async function handleDeleteSubnote(subnoteId: string) {
    if (!selectedNoteId) return;
    await fetch(`/api/notes/${selectedNoteId}/subnotes/${subnoteId}`, { method: "DELETE" });
    await loadNote(selectedNoteId);
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

          {creatingNew ? (
            <NewNoteForm
              onCreated={handleNoteCreated}
              onCancel={() => {
                setCreatingNew(false);
                router.replace("/notes/browse");
                if (isMobile) setSidebarOpen(true);
              }}
            />
          ) : loadingDetail ? (
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
