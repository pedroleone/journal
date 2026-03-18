"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, Plus, Star, ImagePlus, X as XIcon } from "lucide-react";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { VocabularyInput } from "@/components/library/vocabulary-input";
import { useLocale } from "@/hooks/use-locale";
import { MEDIA_TYPES, MEDIA_STATUSES, CREATOR_LABELS } from "@/lib/library";
import type { MediaType, MediaStatus } from "@/lib/library";

export interface LibraryNote {
  id: string;
  content: string;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryDetailData {
  id: string;
  type: MediaType;
  title: string;
  creator: string | null;
  url: string | null;
  status: MediaStatus;
  rating: number | null;
  reactions: string[] | null;
  genres: string[] | null;
  metadata: Record<string, unknown> | null;
  cover_image: string | null;
  content: string | null;
  added_at: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  notes: LibraryNote[];
}

interface LibraryDetailProps {
  item: LibraryDetailData;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  onAddNote: (content: string) => Promise<void>;
  onUpdateNote: (noteId: string, content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onUploadCover?: (file: File) => Promise<void>;
  onDeleteCover?: () => Promise<void>;
}

function formatDate(iso: string): string {
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

interface NoteBlockProps {
  note: LibraryNote;
  onSave: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

function NoteBlock({ note, onSave, onDelete }: NoteBlockProps) {
  const [draft, setDraft] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { t } = useLocale();

  useEffect(() => { setDraft(note.content); }, [note.content]);

  async function handleBlur() {
    if (draft === note.content || !draft.trim()) {
      setDraft(note.content);
      return;
    }
    setSaving(true);
    try { await onSave(draft); } finally { setSaving(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setDraft(note.content); }
  }

  return (
    <div className="group relative">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-[11px] tracking-widest uppercase text-muted-foreground/60 font-medium select-none">
          {formatShortDate(note.created_at)}
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <MarkdownEditor
        value={draft}
        onChange={setDraft}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="..."
        className="text-base leading-[1.85] text-foreground/90"
      />

      <div className="mt-2 flex items-center justify-between h-5">
        {saving && (
          <span className="text-[11px] text-muted-foreground/50 tracking-wide">{t.library.saving}</span>
        )}
        <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {confirmDelete ? (
            <>
              <button onClick={onDelete} className="text-[11px] text-destructive hover:text-destructive/80 font-medium">
                {t.library.delete}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-muted-foreground hover:text-foreground">
                {t.library.cancel}
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LibraryDetail({
  item,
  onUpdate,
  onAddNote,
  onUpdateNote,
  onDelete,
  onDeleteNote,
  onUploadCover,
  onDeleteCover,
}: LibraryDetailProps) {
  const [titleDraft, setTitleDraft] = useState(item.title);
  const [creatorDraft, setCreatorDraft] = useState(item.creator ?? "");
  const [urlDraft, setUrlDraft] = useState(item.url ?? "");
  const [yearDraft, setYearDraft] = useState(
    (item.metadata as Record<string, unknown>)?.year as number | undefined ?? ""
  );
  const [contentDraft, setContentDraft] = useState(item.content ?? "");
  const [savingContent, setSavingContent] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNew = item.id === "__new__";
  const { t } = useLocale();

  const typeLabels: Record<MediaType, string> = {
    book: t.library.book, album: t.library.album, movie: t.library.movie,
    game: t.library.game, video: t.library.video, misc: t.library.misc,
  };
  const statusLabels: Record<MediaStatus, string> = {
    backlog: t.library.backlog, in_progress: t.library.inProgress,
    finished: t.library.finished, dropped: t.library.dropped,
  };

  useEffect(() => {
    setTitleDraft(item.title);
    setCreatorDraft(item.creator ?? "");
    setUrlDraft(item.url ?? "");
    setYearDraft((item.metadata as Record<string, unknown>)?.year as number | undefined ?? "");
    setContentDraft(item.content ?? "");
    setAddingNote(false);
    setNewNoteContent("");
    setConfirmDelete(false);
    setSavingContent(false);
    setSubmittingNote(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  // For new items: explicit create triggered by button or Enter
  async function handleCreate() {
    const newTitle = titleDraft.trim();
    if (!newTitle) return;
    await onUpdate({
      title: newTitle,
      creator: creatorDraft.trim() || undefined,
      url: urlDraft.trim() || undefined,
    }).catch(() => undefined);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isNew && e.key === "Enter") {
      e.preventDefault();
      void handleCreate();
    }
  }

  // For existing items: save on blur
  async function handleTitleBlur() {
    if (isNew) return;
    const newTitle = titleDraft.trim();
    if (newTitle && newTitle !== item.title) {
      await onUpdate({ title: newTitle }).catch(() => undefined);
    }
  }

  async function handleCreatorBlur() {
    if (isNew) return;
    const val = creatorDraft.trim() || null;
    if (val !== item.creator) {
      await onUpdate({ creator: val }).catch(() => undefined);
    }
  }

  async function handleUrlBlur() {
    if (isNew) return;
    const val = urlDraft.trim() || null;
    if (val !== item.url) {
      await onUpdate({ url: val }).catch(() => undefined);
    }
  }

  async function handleYearBlur() {
    if (isNew) return;
    const val = yearDraft !== "" ? Number(yearDraft) : null;
    const current = (item.metadata as Record<string, unknown>)?.year as number | null ?? null;
    if (val !== current) {
      await onUpdate({ metadata: { ...item.metadata, year: val } }).catch(() => undefined);
    }
  }

  async function handleContentBlur() {
    if (contentDraft === (item.content ?? "")) return;
    setSavingContent(true);
    try { await onUpdate({ content: contentDraft }); } finally { setSavingContent(false); }
  }

  async function handleAddNote() {
    if (!newNoteContent.trim()) return;
    setSubmittingNote(true);
    try {
      await onAddNote(newNoteContent.trim());
      setNewNoteContent("");
      setAddingNote(false);
    } finally {
      setSubmittingNote(false);
    }
  }

  function handleNoteKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setAddingNote(false); setNewNoteContent(""); }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { void handleAddNote(); }
  }

  const creatorLabel = CREATOR_LABELS[item.type];

  async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUploadCover) return;
    setUploadingCover(true);
    try {
      await onUploadCover(file);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col min-h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between px-10 py-3 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <time className="text-[11px] tracking-widest uppercase text-muted-foreground/50 font-medium select-none">
          {formatDate(item.created_at)}
        </time>

        <div className="flex items-center gap-1">
          {savingContent && (
            <span className="text-[11px] text-muted-foreground/50 mr-2 tracking-wide">{t.library.saving}</span>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button onClick={onDelete} className="text-xs font-medium text-destructive hover:text-destructive/80 px-2 py-1 rounded">
                {t.library.deleteItem}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded">
                {t.library.cancel}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors" aria-label="Delete item">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-10 sm:px-16 md:px-24 lg:px-32 xl:px-40 py-12 max-w-4xl w-full mx-auto">
        {/* Cover image */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverFileChange}
        />
        {!isNew && (
          item.cover_image ? (
            <div className="group relative mb-8 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${item.cover_image}`}
                alt=""
                className="w-full max-h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="text-xs font-medium text-white bg-white/20 backdrop-blur-sm rounded px-3 py-1.5 hover:bg-white/30 transition-colors"
                >
                  {t.library.changeCover}
                </button>
                <button
                  onClick={onDeleteCover}
                  className="text-xs font-medium text-white bg-white/20 backdrop-blur-sm rounded px-3 py-1.5 hover:bg-red-500/50 transition-colors"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="mb-8 w-full rounded-lg border-2 border-dashed border-border/50 py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground hover:border-border transition-colors"
            >
              <ImagePlus className="h-4 w-4" />
              {uploadingCover ? t.library.saving : t.library.addCover}
            </button>
          )
        )}

        {/* Title / Album Name */}
        <input
          className="w-full bg-transparent font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-tight focus:outline-none placeholder:text-muted-foreground/25 text-foreground mb-5"
          placeholder={item.type === "album" ? t.library.albumName : t.library.title}
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          autoFocus={isNew}
        />

        {/* Promoted artist field for albums */}
        {item.type === "album" && (
          <input
            className="w-full bg-transparent font-display text-2xl sm:text-3xl font-medium tracking-tight leading-tight focus:outline-none placeholder:text-muted-foreground/25 text-foreground/70 mb-5"
            placeholder={t.library.artistName}
            value={creatorDraft}
            onChange={(e) => setCreatorDraft(e.target.value)}
            onBlur={handleCreatorBlur}
          />
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-8">
          {/* Type */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.type}</label>
            <select
              className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none"
              value={item.type}
              onChange={(e) => onUpdate({ type: e.target.value })}
              disabled={!isNew}
            >
              {MEDIA_TYPES.map((mt) => (
                <option key={mt} value={mt}>{typeLabels[mt]}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.status}</label>
            <select
              className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none"
              value={item.status}
              onChange={(e) => onUpdate({ status: e.target.value })}
            >
              {MEDIA_STATUSES.map((ms) => (
                <option key={ms} value={ms}>{statusLabels[ms]}</option>
              ))}
            </select>
          </div>

          {/* Creator (hidden for albums — shown as promoted field above) */}
          {item.type !== "album" && (
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{creatorLabel}</label>
              <input
                className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground/40"
                placeholder={creatorLabel}
                value={creatorDraft}
                onChange={(e) => setCreatorDraft(e.target.value)}
                onBlur={handleCreatorBlur}
              />
            </div>
          )}

          {/* URL (hidden for albums) */}
          {item.type !== "album" && (
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.url}</label>
              <input
                className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground/40"
                placeholder="https://..."
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onBlur={handleUrlBlur}
              />
            </div>
          )}

          {/* Year (all types) */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.year}</label>
            <input
              type="number"
              className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground/40"
              placeholder="2024"
              value={yearDraft}
              onChange={(e) => setYearDraft(e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={handleYearBlur}
            />
          </div>

          {/* Rating */}
          {(item.status === "finished" || item.status === "dropped") && (
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.rating}</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => onUpdate({ rating: item.rating === n ? null : n })}
                    className="p-0.5 transition-colors"
                  >
                    <Star className={`h-5 w-5 ${n <= (item.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type-specific metadata */}
          {item.type === "game" && (
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.platform}</label>
              <VocabularyInput
                field="platform"
                values={((item.metadata as Record<string, unknown>)?.platform as string[]) ?? []}
                onChange={(vals) => onUpdate({ metadata: { ...item.metadata, platform: vals } })}
                placeholder={t.library.platform}
              />
            </div>
          )}
          {item.type === "book" && (
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.pages}</label>
              <input
                type="number"
                className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none"
                value={(item.metadata as Record<string, unknown>)?.pages as number ?? ""}
                onChange={(e) => onUpdate({ metadata: { ...item.metadata, pages: e.target.value ? Number(e.target.value) : null } })}
              />
            </div>
          )}
          {item.type === "movie" && (
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.duration}</label>
              <input
                className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground/40"
                placeholder="2h 30m"
                value={(item.metadata as Record<string, unknown>)?.duration as string ?? ""}
                onChange={(e) => onUpdate({ metadata: { ...item.metadata, duration: e.target.value || null } })}
              />
            </div>
          )}
          {item.type === "video" && (
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.channel}</label>
              <input
                className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground/40"
                placeholder={t.library.channel}
                value={(item.metadata as Record<string, unknown>)?.channel as string ?? ""}
                onChange={(e) => onUpdate({ metadata: { ...item.metadata, channel: e.target.value || null } })}
              />
            </div>
          )}
        </div>

        {/* Genres */}
        <div className="mb-6">
          <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.genres}</label>
          <VocabularyInput
            field="genres"
            values={item.genres ?? []}
            onChange={(vals) => onUpdate({ genres: vals.length > 0 ? vals : null })}
            placeholder={t.library.genres}
          />
        </div>

        {/* Reactions */}
        <div className="mb-10">
          <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.reactions}</label>
          <VocabularyInput
            field="reactions"
            values={item.reactions ?? []}
            onChange={(vals) => onUpdate({ reactions: vals.length > 0 ? vals : null })}
            placeholder={t.library.reactions}
          />
        </div>

        {/* Add to Library button (new items only) */}
        {isNew && (
          <div className="mb-10">
            <button
              onClick={handleCreate}
              disabled={!titleDraft.trim()}
              className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-30 hover:opacity-80 transition-opacity"
            >
              {t.library.addToLibrary}
            </button>
          </div>
        )}

        {/* Content */}
        {!isNew && (
          <MarkdownEditor
            key={item.id}
            value={contentDraft}
            onChange={setContentDraft}
            onBlur={handleContentBlur}
            placeholder="Notes..."
            className="text-base sm:text-[17px] leading-[1.9] text-foreground/85"
          />
        )}

        {/* Thought log */}
        {item.notes.length > 0 && (
          <div className="mt-12 space-y-8">
            {item.notes.map((note) => (
              <NoteBlock
                key={note.id}
                note={note}
                onSave={(content) => onUpdateNote(note.id, content)}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))}
          </div>
        )}

        {/* Add thought */}
        <div className="mt-12">
          {addingNote ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 mb-5">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[11px] tracking-widest uppercase text-muted-foreground/60 font-medium select-none">
                  {t.library.addThought}
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <MarkdownEditor
                value={newNoteContent}
                onChange={setNewNoteContent}
                onKeyDown={handleNoteKeyDown}
                placeholder={t.library.writeThought}
                autoFocus
                className="text-base leading-[1.85] text-foreground/85"
              />
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleAddNote}
                  disabled={submittingNote || !newNoteContent.trim()}
                  className="text-xs font-medium bg-foreground text-background rounded px-3 py-1.5 disabled:opacity-40 hover:opacity-80 transition-opacity"
                >
                  {submittingNote ? t.library.adding : t.library.addThought}
                </button>
                <button
                  onClick={() => { setAddingNote(false); setNewNoteContent(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t.library.cancel}
                </button>
              </div>
            </div>
          ) : (
            !isNew && (
              <button
                onClick={() => setAddingNote(true)}
                className="group flex items-center gap-2.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors py-2"
              >
                <span className="h-px w-6 bg-current transition-all group-hover:w-10" />
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs tracking-wide">{t.library.addThought}</span>
              </button>
            )
          )}
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}
