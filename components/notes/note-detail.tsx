"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, Plus, X, Paperclip, Loader2 } from "lucide-react";
import { useImages } from "@/hooks/use-images";
import { uploadEncryptedImage, deleteEncryptedImage } from "@/lib/client-images";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { useLocale } from "@/hooks/use-locale";

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
  onImagesChange: (noteId: string, images: string[]) => Promise<void> | void;
}

function formatNoteDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


interface SubnoteBlockProps {
  subnote: Subnote;
  onSave: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

function SubnoteBlock({ subnote, onSave, onDelete }: SubnoteBlockProps) {
  const [draft, setDraft] = useState(subnote.content);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { t } = useLocale();

  useEffect(() => { setDraft(subnote.content); }, [subnote.content]);

  async function handleBlur() {
    if (draft === subnote.content || !draft.trim()) {
      setDraft(subnote.content);
      return;
    }
    setSaving(true);
    try { await onSave(draft); } finally { setSaving(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setDraft(subnote.content); }
  }

  return (
    <div className="group relative">
      {/* Thin rule above each subnote */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-[11px] tracking-widest uppercase text-muted-foreground/60 font-medium select-none">
          {formatShortDate(subnote.created_at)}
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <MarkdownEditor
        value={draft}
        onChange={setDraft}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={t.notes.subnote}
        className="text-base leading-[1.85] text-foreground/90"
      />

      {/* Delete / saving indicators */}
      <div className="mt-2 flex items-center justify-between h-5">
        {saving && (
          <span className="text-[11px] text-muted-foreground/50 tracking-wide">{t.notes.saving}</span>
        )}
        <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirmDelete ? (
            <>
              <button
                onClick={onDelete}
                className="text-[11px] text-destructive hover:text-destructive/80 font-medium"
              >
                {t.notes.delete}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                {t.notes.cancel}
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-muted-foreground/50 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
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
  onImagesChange,
}: NoteDetailProps) {
  const [titleDraft, setTitleDraft] = useState(note.title ?? "");
  const [contentDraft, setContentDraft] = useState(note.content);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(note.tags ?? []);
  const [savingContent, setSavingContent] = useState(false);
  const [addingSubnote, setAddingSubnote] = useState(false);
  const [newSubnoteContent, setNewSubnoteContent] = useState("");
  const [submittingSubnote, setSubmittingSubnote] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { images } = useImages(note.images);
  const isNew = note.id === "__new__";
  const { t } = useLocale();

  useEffect(() => {
    setTitleDraft(note.title ?? "");
    setContentDraft(note.content);
    setTags(note.tags ?? []);
    setTagInput("");
    setAddingSubnote(false);
    setNewSubnoteContent("");
    setConfirmDelete(false);
    setImageError("");
    setSavingContent(false);
    setSubmittingSubnote(false);
    setUploadingImage(false);
    // Only reset drafts on note switch — not when server returns updated fields
    // for the current note, which would wipe in-progress input (e.g. tag typing).
    // The component is keyed by note.id so it remounts on switch anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  async function handleTitleBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (isNew) {
      const nextFocused = e.relatedTarget;
      if (nextFocused instanceof Node && editorRef.current?.contains(nextFocused)) {
        return;
      }
    }

    const newTitle = titleDraft.trim() || null;
    if (newTitle !== note.title) {
      await onUpdate({ title: newTitle }).catch(() => undefined);
    }
  }

  async function handleContentBlur() {
    if (contentDraft === note.content) return;
    setSavingContent(true);
    try { await onUpdate({ content: contentDraft }); } finally { setSavingContent(false); }
  }

  function handleContentKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setContentDraft(note.content);
  }

  async function commitTagInput() {
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

  async function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); await commitTagInput(); }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      e.preventDefault();
      await handleRemoveTag(tags[tags.length - 1]);
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

  function handleSubnoteKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setAddingSubnote(false); setNewSubnoteContent(""); }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { void handleAddSubnote(); }
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files?.length || isNew) return;
    setUploadingImage(true);
    setImageError("");
    try {
      for (const file of Array.from(files)) {
        const result = await uploadEncryptedImage({ file, ownerKind: "note", ownerId: note.id });
        await onImagesChange(note.id, result.images);
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveImage(imageKey: string) {
    if (isNew) return;
    try {
      const result = await deleteEncryptedImage({ imageKey, ownerKind: "note", ownerId: note.id });
      await onImagesChange(note.id, result.images);
    } catch {
      setImageError("Failed to remove image");
    }
  }

  return (
    <div ref={editorRef} className="relative flex flex-col min-h-full">
      {/* Top bar: date left, actions right */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-10 py-3 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <time className="text-[11px] tracking-widest uppercase text-muted-foreground/50 font-medium select-none">
          {formatNoteDate(note.created_at)}
        </time>

        <div className="flex items-center gap-1">
          {savingContent && (
            <span className="text-[11px] text-muted-foreground/50 mr-2 tracking-wide">{t.notes.saving}</span>
          )}
          {/* Image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { void handleImageFiles(e.target.files); }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isNew || uploadingImage}
            title={isNew ? t.notes.saveNoteFirst : "Attach image"}
            className="p-1.5 rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onDelete}
                className="text-xs font-medium text-destructive hover:text-destructive/80 px-2 py-1 rounded"
              >
                {t.notes.deleteNote}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
              >
                {t.notes.cancel}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
              aria-label="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Writing canvas */}
      <div className="flex-1 px-10 sm:px-16 md:px-24 lg:px-32 xl:px-40 py-12 max-w-4xl w-full mx-auto">

        {/* Title */}
        <input
          className="w-full bg-transparent font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-tight focus:outline-none placeholder:text-muted-foreground/25 text-foreground mb-5"
          placeholder={t.notes.untitled}
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleTitleBlur}
        />

        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-10 min-h-[1.5rem]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground tracking-wide"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-foreground leading-none transition-colors"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <input
            className="bg-transparent text-[11px] tracking-wide text-muted-foreground/60 placeholder:text-muted-foreground/30 focus:outline-none min-w-[72px]"
            placeholder={t.notes.addTag}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => { if (tagInput.trim()) commitTagInput(); }}
          />
        </div>

        {/* Main content — open canvas, no box */}
        <MarkdownEditor
          key={note.id}
          value={contentDraft}
          onChange={setContentDraft}
          onBlur={handleContentBlur}
          onKeyDown={handleContentKeyDown}
          placeholder={t.notes.startWriting}
          className="text-base sm:text-[17px] leading-[1.9] text-foreground/85"
        />

        {/* Image error */}
        {imageError && (
          <p className="mt-3 text-xs text-destructive">{imageError}</p>
        )}

        {/* Images */}
        {images.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {images.map((image) => (
              <div key={image.key} className="group relative overflow-hidden rounded-lg border border-border/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-48 w-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(image.key)}
                  className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Subnotes */}
        {note.subnotes.length > 0 && (
          <div className="mt-12 space-y-8">
            {note.subnotes.map((subnote) => (
              <SubnoteBlock
                key={subnote.id}
                subnote={subnote}
                onSave={(content) => onUpdateSubnote(subnote.id, content)}
                onDelete={() => onDeleteSubnote(subnote.id)}
              />
            ))}
          </div>
        )}

        {/* Add subnote */}
        <div className="mt-12">
          {addingSubnote ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[11px] tracking-widest uppercase text-muted-foreground/60 font-medium select-none">
                  {t.notes.newEntry}
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <MarkdownEditor
                value={newSubnoteContent}
                onChange={setNewSubnoteContent}
                onKeyDown={handleSubnoteKeyDown}
                placeholder={t.notes.writeSubnote}
                autoFocus
                className="text-base leading-[1.85] text-foreground/85"
              />
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleAddSubnote}
                  disabled={submittingSubnote || !newSubnoteContent.trim()}
                  className="text-xs font-medium bg-foreground text-background rounded px-3 py-1.5 disabled:opacity-40 hover:opacity-80 transition-opacity"
                >
                  {submittingSubnote ? t.notes.adding : t.notes.addEntry}
                </button>
                <button
                  onClick={() => { setAddingSubnote(false); setNewSubnoteContent(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.notes.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingSubnote(true)}
              className="group flex items-center gap-2.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors py-2"
            >
              <span className="h-px w-6 bg-current transition-all group-hover:w-10" />
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs tracking-wide">{t.notes.addEntry}</span>
            </button>
          )}
        </div>

        {/* Bottom breathing room */}
        <div className="h-10" />
      </div>
    </div>
  );
}
