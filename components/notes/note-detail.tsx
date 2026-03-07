"use client";

import { useState, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Subnote {
  id: string;
  content: string;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface NoteDetailData {
  id: string;
  title: string | null;
  tags: string[] | null;
  images: string[] | null;
  content: string;
  created_at: string;
  updated_at: string;
  subnotes: Subnote[];
}

interface NoteDetailProps {
  note: NoteDetailData;
  onUpdate: (data: { title?: string | null; content?: string; tags?: string[] | null }) => Promise<void>;
  onAddSubnote: (content: string) => Promise<void>;
  onUpdateSubnote: (subnoteId: string, content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onDeleteSubnote: (subnoteId: string) => Promise<void>;
}

function formatNoteDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ContentBlockProps {
  content: string;
  label?: string;
  onSave: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function ContentBlock({ content, label, onSave, onDelete }: ContentBlockProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border/60 p-4 space-y-2">
      {label && (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      )}
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[120px]"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setDraft(content); setEditing(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="group relative">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" onClick={() => { setDraft(content); setEditing(true); }}>
              Edit
            </Button>
            {onDelete && (
              <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function NoteDetail({
  note,
  onUpdate,
  onAddSubnote,
  onUpdateSubnote,
  onDelete,
  onDeleteSubnote,
}: NoteDetailProps) {
  const [titleDraft, setTitleDraft] = useState(note.title ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [addingSubnote, setAddingSubnote] = useState(false);
  const [newSubnoteContent, setNewSubnoteContent] = useState("");
  const [submittingSubnote, setSubmittingSubnote] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  async function handleTitleBlur() {
    const newTitle = titleDraft.trim() || null;
    if (newTitle !== note.title) {
      await onUpdate({ title: newTitle }).catch(() => undefined);
    }
  }

  async function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag)) {
        const newTags = [...tags, tag];
        setTags(newTags);
        setTagInput("");
        await onUpdate({ tags: newTags }).catch(() => undefined);
      } else {
        setTagInput("");
      }
    }
  }

  async function handleRemoveTag(tag: string) {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    await onUpdate({ tags: newTags.length > 0 ? newTags : null }).catch(() => undefined);
  }

  async function handleAddSubnote() {
    if (!newSubnoteContent.trim()) return;
    setSubmittingSubnote(true);
    try {
      await onAddSubnote(newSubnoteContent.trim());
      setNewSubnoteContent("");
      setAddingSubnote(false);
    } finally {
      setSubmittingSubnote(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <input
          ref={titleRef}
          className="flex-1 bg-transparent text-2xl font-display tracking-tight focus:outline-none placeholder:text-muted-foreground"
          placeholder="Untitled"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleTitleBlur}
        />
        {confirmDelete ? (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-foreground leading-none"
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
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

      <p className="text-xs text-muted-foreground">
        Created {formatNoteDate(note.created_at)}
      </p>

      <ContentBlock
        content={note.content}
        onSave={(content) => onUpdate({ content })}
      />

      {note.subnotes.map((subnote) => (
        <ContentBlock
          key={subnote.id}
          content={subnote.content}
          label={formatNoteDate(subnote.created_at)}
          onSave={(content) => onUpdateSubnote(subnote.id, content)}
          onDelete={() => onDeleteSubnote(subnote.id)}
        />
      ))}

      {addingSubnote ? (
        <div className="rounded-lg border border-border/60 p-4 space-y-2">
          <textarea
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]"
            placeholder="Add a subnote..."
            value={newSubnoteContent}
            onChange={(e) => setNewSubnoteContent(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddSubnote} disabled={submittingSubnote || !newSubnoteContent.trim()}>
              {submittingSubnote ? "Adding..." : "Add"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAddingSubnote(false); setNewSubnoteContent(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => setAddingSubnote(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add subnote
        </Button>
      )}
    </div>
  );
}
