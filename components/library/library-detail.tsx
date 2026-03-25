"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, Plus, Star, ImagePlus, X as XIcon, Pencil } from "lucide-react";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { VocabularyInput } from "@/components/library/vocabulary-input";
import { StatusTransition } from "@/components/library/status-transition";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";
import { MEDIA_TYPES, CREATOR_LABELS } from "@/lib/library";
import type { MediaType, MediaStatus } from "@/lib/library";

const STATUS_BADGE_COLORS: Record<MediaStatus, string> = {
  backlog: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  finished: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dropped: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

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
  onCreate?: (data: Record<string, unknown>) => Promise<void>;
  onAddNote: (content: string) => Promise<void>;
  onUpdateNote: (noteId: string, content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onUploadCover?: (file: File) => Promise<void>;
  onDeleteCover?: () => Promise<void>;
  coverUploadDisabled?: boolean;
}

function formatDate(iso: string, localeCode: string): string {
  return new Date(iso).toLocaleString(localeCode, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string, localeCode: string): string {
  return new Date(iso).toLocaleDateString(localeCode, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getFieldDisplayMode(editMode: boolean): "view" | "edit" {
  return editMode ? "edit" : "view";
}

function ViewModeField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function ViewModeTagField({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null;
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
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
          {formatShortDate(note.created_at, t.localeCode)}
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
          <button onClick={() => setConfirmDelete(true)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={onDelete}
        title="Delete thought"
        description="This thought will be permanently deleted. This action cannot be undone."
      />
    </div>
  );
}

export function LibraryDetail({
  item,
  onUpdate,
  onCreate,
  onAddNote,
  onUpdateNote,
  onDelete,
  onDeleteNote,
  onUploadCover,
  onDeleteCover,
  coverUploadDisabled = false,
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
  const [editMode, setEditMode] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const isNew = item.id === "__new__";
  // TODO: Support cover upload for unsaved library items by creating the item first and then uploading the selected cover.
  const isCoverUploadDisabled = coverUploadDisabled || uploadingCover;
  const { t } = useLocale();
  const mode = getFieldDisplayMode(editMode || isNew);

  const enterEditMode = useCallback(() => {
    setEditMode(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setTitleDraft(item.title);
    setCreatorDraft(item.creator ?? "");
    setUrlDraft(item.url ?? "");
    setYearDraft((item.metadata as Record<string, unknown>)?.year as number | undefined ?? "");
    setContentDraft(item.content ?? "");
    setEditMode(false);
  }, [item.title, item.creator, item.url, item.metadata, item.content]);

  const saveAndExitEdit = useCallback(async () => {
    // Trigger saves for any changed fields
    const updates: Record<string, unknown> = {};
    const newTitle = titleDraft.trim();
    if (newTitle && newTitle !== item.title) updates.title = newTitle;
    const creatorVal = creatorDraft.trim() || null;
    if (creatorVal !== item.creator) updates.creator = creatorVal;
    const urlVal = urlDraft.trim() || null;
    if (urlVal !== item.url) updates.url = urlVal;
    const yearVal = yearDraft !== "" ? Number(yearDraft) : null;
    const currentYear = (item.metadata as Record<string, unknown> | null)?.year as number | null ?? null;
    if (yearVal !== currentYear) updates.metadata = { ...(item.metadata ?? {}), year: yearVal };
    if (contentDraft !== (item.content ?? "")) updates.content = contentDraft || null;

    if (Object.keys(updates).length > 0) {
      await onUpdate(updates).catch(() => undefined);
    }
    setEditMode(false);
  }, [titleDraft, creatorDraft, urlDraft, yearDraft, contentDraft, item, onUpdate]);

  const typeLabels: Record<MediaType, string> = {
    book: t.library.book, album: t.library.album, movie: t.library.movie,
    game: t.library.game, video: t.library.video, misc: t.library.misc,
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
    setEditMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function handleCreate() {
    const newTitle = titleDraft.trim();
    if (!newTitle) return;
    await onCreate?.({
      type: item.type,
      title: newTitle,
      creator: creatorDraft.trim() || null,
      url: urlDraft.trim() || null,
      status: item.status,
      rating: item.rating,
      reactions: item.reactions,
      genres: item.genres,
      metadata: {
        ...(item.metadata ?? {}),
        year: yearDraft !== "" ? Number(yearDraft) : null,
      },
      content: contentDraft || null,
    }).catch(() => undefined);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isNew && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleCreate();
    }
  }

  async function handleTitleBlur() {
    if (isNew) {
      await onUpdate({ title: titleDraft }).catch(() => undefined);
      return;
    }
    const newTitle = titleDraft.trim();
    if (newTitle && newTitle !== item.title) {
      await onUpdate({ title: newTitle }).catch(() => undefined);
    }
  }

  async function handleCreatorBlur() {
    if (isNew) {
      await onUpdate({ creator: creatorDraft.trim() || null }).catch(() => undefined);
      return;
    }
    const val = creatorDraft.trim() || null;
    if (val !== item.creator) {
      await onUpdate({ creator: val }).catch(() => undefined);
    }
  }

  async function handleUrlBlur() {
    if (isNew) {
      await onUpdate({ url: urlDraft.trim() || null }).catch(() => undefined);
      return;
    }
    const val = urlDraft.trim() || null;
    if (val !== item.url) {
      await onUpdate({ url: val }).catch(() => undefined);
    }
  }

  async function handleYearBlur() {
    const val = yearDraft !== "" ? Number(yearDraft) : null;
    const current = (item.metadata as Record<string, unknown> | null)?.year as number | null ?? null;
    if (isNew || val !== current) {
      await onUpdate({ metadata: { ...(item.metadata ?? {}), year: val } }).catch(() => undefined);
    }
  }

  async function handleContentBlur() {
    if (!isNew && contentDraft === (item.content ?? "")) return;
    setSavingContent(true);
    try { await onUpdate({ content: contentDraft || null }); } finally { setSavingContent(false); }
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

  function handleEmptyCoverClick() {
    if (isCoverUploadDisabled) return;
    coverInputRef.current?.click();
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 lg:px-10 py-3 border-b border-border/40">
        {isNew ? (
          <span className="text-[11px] tracking-widest uppercase text-muted-foreground/50 font-medium select-none">
            {typeLabels[item.type]}
          </span>
        ) : (
          <time className="text-[11px] tracking-widest uppercase text-muted-foreground/50 font-medium select-none">
            {formatDate(item.created_at, t.localeCode)}
          </time>
        )}

        <div className="flex items-center gap-1">
          {savingContent && (
            <span className="text-[11px] text-muted-foreground/50 mr-2 tracking-wide">{t.library.saving}</span>
          )}
          {isNew ? (
            <button
              onClick={() => void handleCreate()}
              disabled={!titleDraft.trim()}
              className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-30 hover:opacity-80 transition-opacity"
            >
              {t.library.addToLibrary}
            </button>
          ) : editMode ? (
            <>
              <button
                onClick={() => void saveAndExitEdit()}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity"
              >
                {t.library.save}
              </button>
              <button
                onClick={cancelEdit}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
              >
                {t.library.cancel}
              </button>
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors" aria-label="Delete item">
                <Trash2 className="h-4 w-4" />
              </button>
              <ConfirmDeleteDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                onConfirm={onDelete}
                title="Delete library item"
                description="This library item and all its notes will be permanently deleted. This action cannot be undone."
              />
            </>
          ) : (
            <>
              <button onClick={enterEditMode} className="p-1.5 rounded text-muted-foreground/40 hover:text-foreground transition-colors" aria-label="Edit item">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors" aria-label="Delete item">
                <Trash2 className="h-4 w-4" />
              </button>
              <ConfirmDeleteDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                onConfirm={onDelete}
                title="Delete library item"
                description="This library item and all its notes will be permanently deleted. This action cannot be undone."
              />
            </>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left column: cover, title, metadata */}
        <div className="lg:w-1/3 lg:min-w-[280px] lg:max-w-[400px] lg:border-r border-border/40 p-6 lg:p-8 space-y-6">
          {/* Cover image */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverFileChange}
          />
          {item.cover_image ? (
            <div className="group relative rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/images/${encodeURIComponent(item.cover_image)}`}
                alt=""
                className="w-full object-cover"
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
          ) : mode === "edit" ? (
            <button
              type="button"
              onClick={handleEmptyCoverClick}
              disabled={isCoverUploadDisabled}
              className={`w-full rounded-lg border-2 border-dashed py-8 flex items-center justify-center gap-2 text-sm transition-colors ${
                isCoverUploadDisabled
                  ? "cursor-not-allowed border-border/30 text-muted-foreground/30 opacity-60"
                  : "border-border/50 text-muted-foreground/50 hover:text-muted-foreground hover:border-border"
              }`}
            >
              <ImagePlus className="h-4 w-4" />
              {uploadingCover ? t.library.saving : t.library.addCover}
            </button>
          ) : null}

          {/* Title */}
          {mode === "view" ? (
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-foreground">
              {item.title}
            </h1>
          ) : (
            <input
              className="w-full bg-transparent font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-tight focus:outline-none placeholder:text-muted-foreground/25 text-foreground"
              placeholder={item.type === "album" ? t.library.albumName : t.library.title}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoComplete="off"
              data-1p-ignore
            />
          )}

          {/* Artist (albums) */}
          {item.type === "album" && (
            mode === "view" ? (
              item.creator && (
                <p className="font-display text-lg font-medium tracking-tight leading-tight text-foreground/70">
                  {item.creator}
                </p>
              )
            ) : (
              <input
                className="w-full bg-transparent font-display text-lg font-medium tracking-tight leading-tight focus:outline-none placeholder:text-muted-foreground/25 text-foreground/70"
                placeholder={t.library.artistName}
                value={creatorDraft}
                onChange={(e) => setCreatorDraft(e.target.value)}
                onBlur={handleCreatorBlur}
                autoComplete="off"
                data-1p-ignore
              />
            )
          )}

          {/* Status transitions */}
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">{t.library.status}</label>
            {mode === "edit" ? (
              <StatusTransition
                status={item.status}
                type={item.type}
                onStatusChange={(status) => onUpdate({ status })}
              />
            ) : (
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_BADGE_COLORS[item.status])}>
                {item.type === "album"
                  ? (item.status === "in_progress" ? t.library.listening : item.status === "finished" ? t.library.listened : item.status === "backlog" ? t.library.backlog : t.library.dropped)
                  : (item.status === "in_progress" ? t.library.inProgress : item.status === "finished" ? t.library.finished : item.status === "backlog" ? t.library.backlog : t.library.dropped)
                }
              </span>
            )}
          </div>

          {/* Metadata fields */}
          {mode === "view" ? (
            <div className="space-y-4">
              {/* Creator (hidden for albums — shown inline above) */}
              {item.type !== "album" && (
                <ViewModeField label={creatorLabel} value={item.creator ?? ""} />
              )}

              {/* URL */}
              {item.type !== "album" && item.url && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">{t.library.url}</span>
                  <p className="text-sm">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {item.url}
                    </a>
                  </p>
                </div>
              )}

              {/* Year */}
              <ViewModeField label={t.library.year} value={String((item.metadata as Record<string, unknown>)?.year ?? "")} />

              {/* Rating */}
              {(item.status === "finished" || item.status === "dropped") && item.rating && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">{t.library.rating}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-4 w-4 ${n <= (item.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Type-specific metadata */}
              {item.type === "game" && (
                <ViewModeTagField label={t.library.platform} values={((item.metadata as Record<string, unknown>)?.platform as string[]) ?? []} />
              )}
              {item.type === "book" && (
                <ViewModeField label={t.library.pages} value={String((item.metadata as Record<string, unknown>)?.pages ?? "")} />
              )}
              {item.type === "movie" && (
                <ViewModeField label={t.library.duration} value={((item.metadata as Record<string, unknown>)?.duration as string) ?? ""} />
              )}
              {item.type === "video" && (
                <ViewModeField label={t.library.channel} value={((item.metadata as Record<string, unknown>)?.channel as string) ?? ""} />
              )}

              {/* Genres */}
              <ViewModeTagField label={t.library.genres} values={item.genres ?? []} />
            </div>
          ) : (
            <div className="space-y-4">
              {isNew && (
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.type}</label>
                  <select
                    className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none"
                    value={item.type}
                    onChange={(e) => onUpdate({ type: e.target.value })}
                  >
                    {MEDIA_TYPES.map((mt) => (
                      <option key={mt} value={mt}>{typeLabels[mt]}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Creator (hidden for albums) */}
              {item.type !== "album" && (
                <div>
                  <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{creatorLabel}</label>
                  <input
                    className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground/40"
                    placeholder={creatorLabel}
                    value={creatorDraft}
                    onChange={(e) => setCreatorDraft(e.target.value)}
                    onBlur={handleCreatorBlur}
                    autoComplete="off"
                    data-1p-ignore
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
                    autoComplete="off"
                    data-1p-ignore
                  />
                </div>
              )}

              {/* Year */}
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.year}</label>
                <input
                  type="number"
                  className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground/40"
                  placeholder="2024"
                  value={yearDraft}
                  onChange={(e) => setYearDraft(e.target.value === "" ? "" : Number(e.target.value))}
                  onBlur={handleYearBlur}
                  autoComplete="off"
                  data-1p-ignore
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
                    mediaType={item.type}
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
                    autoComplete="off"
                    data-1p-ignore
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
                    autoComplete="off"
                    data-1p-ignore
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
                    autoComplete="off"
                    data-1p-ignore
                  />
                </div>
              )}

              {/* Genres */}
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.genres}</label>
                <VocabularyInput
                  field="genres"
                  values={item.genres ?? []}
                  onChange={(vals) => onUpdate({ genres: vals.length > 0 ? vals : null })}
                  placeholder={t.library.genres}
                  mediaType={item.type}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right column: reactions, content, thoughts */}
        <div className="flex-1 p-6 lg:p-8 lg:pl-10">
          <div className="max-w-3xl">
            {/* Reactions */}
            <div className="mb-8">
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">{t.library.reactions}</label>
              <VocabularyInput
                field="reactions"
                values={item.reactions ?? []}
                onChange={(vals) => onUpdate({ reactions: vals.length > 0 ? vals : null })}
                placeholder={t.library.reactions}
              />
            </div>

            {/* Content */}
            <MarkdownEditor
              key={item.id}
              value={contentDraft}
              onChange={setContentDraft}
              onBlur={handleContentBlur}
              placeholder="Notes..."
              className="text-base sm:text-[17px] leading-[1.9] text-foreground/85"
            />

            {/* Thought log */}
            {!isNew && item.notes.length > 0 && (
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
            {!isNew && (
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
                <button
                  onClick={() => setAddingNote(true)}
                  className="group flex items-center gap-2.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors py-2"
                >
                  <span className="h-px w-6 bg-current transition-all group-hover:w-10" />
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs tracking-wide">{t.library.addThought}</span>
                </button>
              )}
              </div>
            )}

            <div className="h-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
