"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Loader2,
  AlertCircle,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import { ImageLightbox } from "@/components/image-lightbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useImages } from "@/hooks/use-images";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { deleteEncryptedImage, uploadEncryptedImage } from "@/lib/client-images";
import { useLocale } from "@/hooks/use-locale";

function formatWriteDate(date: Date, localeCode: string): string {
  return date.toLocaleDateString(localeCode, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface JournalEntryResponse {
  id: string;
  source: "web";
  year: number;
  month: number;
  day: number;
  content: string;
  images: string[] | null;
}

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editEntryId = searchParams.get("entry");
  const queryYear = searchParams.get("year");
  const queryMonth = searchParams.get("month");
  const queryDay = searchParams.get("day");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialDate = (() => {
    const year = Number(queryYear);
    const month = Number(queryMonth);
    const day = Number(queryDay);

    if (
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      Number.isInteger(day) &&
      year > 0 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return new Date(year, month - 1, day);
    }

    return new Date();
  })();

  const [content, setContent] = useState("");
  const [date, setDate] = useState(initialDate);
  const [loadedEntryId, setLoadedEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [readyForEditing, setReadyForEditing] = useState(false);
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [entryError, setEntryError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [writeLightboxIndex, setWriteLightboxIndex] = useState<number | null>(null);
  const isOnline = useOnlineStatus();
  const { t } = useLocale();
  const { images } = useImages(imageKeys);

  const createEmptyEntry = useCallback(async (targetDate: Date) => {
    const response = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "",
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1,
        day: targetDate.getDate(),
        hour: new Date().getHours(),
        images: [],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create entry");
    }

    const data = await response.json();
    setLoadedEntryId(data.id);
    return data.id as string;
  }, []);

  const ensureEntryId = useCallback(async () => {
    if (loadedEntryId) return loadedEntryId;
    return createEmptyEntry(date);
  }, [createEmptyEntry, date, loadedEntryId]);

  const loadEntry = useCallback(async (id: string) => {
    setEntryError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/entries/${id}`);
      if (!res.ok) throw new Error("Failed to load entry");

      const entry: JournalEntryResponse = await res.json();
      setContent(entry.content);
      setDate(new Date(entry.year, entry.month - 1, entry.day));
      setLoadedEntryId(id);
      setImageKeys(entry.images ?? []);
    } catch {
      setEntryError(t.journal.failedToLoadEntry);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadEntryForDate = useCallback(async (targetDate: Date) => {
    setEntryError("");
    const params = new URLSearchParams({
      year: String(targetDate.getFullYear()),
      month: String(targetDate.getMonth() + 1),
      day: String(targetDate.getDate()),
    });

    try {
      const res = await fetch(`/api/entries?${params}`);
      if (!res.ok) return;
      const entries: JournalEntryResponse[] = await res.json();
      const entry = entries[0];

      if (entry) {
        setContent(entry.content);
        setLoadedEntryId(entry.id);
        setImageKeys(entry.images ?? []);
      } else {
        setContent("");
        setLoadedEntryId(null);
        setImageKeys([]);
      }
    } catch {
      setEntryError(t.journal.failedToLoadJournalEntry);
    }
  }, [t]);

  useEffect(() => {
    if (!isOnline || !editEntryId) return;
    setReadyForEditing(false);
    void loadEntry(editEntryId).finally(() => {
      setReadyForEditing(true);
    });
  }, [editEntryId, isOnline, loadEntry]);

  useEffect(() => {
    if (!isOnline || editEntryId) return;
    setReadyForEditing(true);
    void loadEntryForDate(date);
  }, [date, editEntryId, isOnline, loadEntryForDate]);

  useEffect(() => {
    if (editEntryId) return;

    const year = Number(queryYear);
    const month = Number(queryMonth);
    const day = Number(queryDay);
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day) ||
      year <= 0 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return;
    }

    const nextDate = new Date(year, month - 1, day);
    if (
      nextDate.getFullYear() !== date.getFullYear() ||
      nextDate.getMonth() !== date.getMonth() ||
      nextDate.getDate() !== date.getDate()
    ) {
      setDate(nextDate);
    }
  }, [date, editEntryId, queryDay, queryMonth, queryYear]);

  const { status, save } = useAutoSave({
    entryId: loadedEntryId,
    content,
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

  useEffect(() => {
    if (!content.trim() || status === "saved") return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [content, status]);

  async function handleImageSelection(files: FileList | null) {
    if (!files?.length || !isOnline) return;

    setUploadingImages(true);
    setEntryError("");
    try {
      const ownerId = await ensureEntryId();

      for (const file of Array.from(files)) {
        const result = await uploadEncryptedImage({
          file,
          ownerKind: "journal",
          ownerId,
        });
        setImageKeys(result.images);
      }
    } catch (error) {
      setEntryError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveImage(imageKey: string) {
    if (!loadedEntryId) return;

    try {
      const result = await deleteEncryptedImage({
        imageKey,
        ownerKind: "journal",
        ownerId: loadedEntryId,
      });
      setImageKeys(result.images);
    } catch {
      setEntryError("Failed to remove image");
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    void handleImageSelection(e.dataTransfer.files);
  }

  function handleNewThought() {
    const time = new Date().toLocaleTimeString(t.localeCode, {
      hour: "numeric",
      minute: "2-digit",
    });
    setContent((prev) => `${prev}\n\n---\n\n*${time}*\n\n`);
  }

  const metaStatus = (() => {
    if (status === "saving") {
      return {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        label: t.journal.saving,
      };
    }

    if (status === "saved") {
      return {
        icon: <Check className="h-3.5 w-3.5" />,
        label: t.journal.saved,
      };
    }

    if (status === "error") {
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        label: t.journal.saveFailed,
      };
    }

    if (status === "offline") {
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        label: t.journal.offline,
      };
    }

    return {
      icon: <Plus className="h-3.5 w-3.5" />,
      label: "Draft",
    };
  })();

  if (!isOnline && !readyForEditing) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-md space-y-2 text-center">
          <h1 className="font-display text-2xl tracking-tight">{t.journal.connectionRequired}</h1>
          <p className="text-sm text-muted-foreground">
            {t.journal.connectionRequiredDesc}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="pointer-events-none fixed inset-0 z-40 m-4 rounded-xl ring-2 ring-primary/50 bg-primary/5 transition-all" />
      )}
      {!isOnline && (
        <div className="border-b border-border/60 bg-secondary/60 px-6 py-2 text-center text-sm text-muted-foreground">
          {t.journal.offlineChanges}
        </div>
      )}
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <section className="mx-auto w-full max-w-[760px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button className="font-display text-[2rem] leading-tight tracking-tight text-foreground transition-colors hover:text-muted-foreground sm:text-[2.25rem]">
                  {formatWriteDate(date, t.localeCode)}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setLoadedEntryId(null);
                      router.replace(
                        `/journal/write?year=${d.getFullYear()}&month=${d.getMonth() + 1}&day=${d.getDate()}`,
                      );
                      setCalendarOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>

            <Link
              href={`/journal/browse?date=${date.toISOString().slice(0, 10)}`}
              className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-secondary/35 px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary/60"
            >
              Browse Entries
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>{editEntryId || loadedEntryId ? "Editing" : "Writing"}</span>
            <span className="inline-flex items-center gap-1.5">
              {metaStatus.icon}
              {metaStatus.label}
            </span>
          </div>

          {entryError ? (
            <div className="mt-4 text-sm text-destructive">{entryError}</div>
          ) : null}

          <div className="pb-4 pt-6">
            <MarkdownEditor
              value={content}
              onChange={setContent}
              onBlur={() => { void save(); }}
              placeholder={t.journal.startWriting}
              className="journal-prose"
              minHeight="calc(100vh - 12rem)"
              autoFocus
            />

            {images.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {images.map((image, i) => (
                  <div
                    key={image.key}
                    className="relative overflow-hidden rounded-lg border border-border/50 bg-card/20"
                  >
                    {/* Blob URLs back these previews, so Next/Image is not a good fit here. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt=""
                      className="h-48 w-full cursor-pointer object-cover"
                      onClick={() => setWriteLightboxIndex(i)}
                    />
                    <button
                      onClick={() => handleRemoveImage(image.key)}
                      className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground shadow-sm"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {writeLightboxIndex !== null && (
              <ImageLightbox
                images={images}
                index={writeLightboxIndex}
                onIndexChange={setWriteLightboxIndex}
                onClose={() => setWriteLightboxIndex(null)}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void handleImageSelection(event.target.files);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="journal-utility-action"
                disabled={!isOnline || uploadingImages}
              >
                {uploadingImages ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Paperclip className="h-3 w-3" />
                )}
                {t.journal.image}
              </button>
              <button
                onClick={handleNewThought}
                className="journal-utility-action"
              >
                <Plus className="h-3 w-3" />
                {t.journal.newThought}
              </button>
              {imageKeys.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {imageKeys.length} attached
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {status === "saving" && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t.journal.saving}
                </>
              )}
              {status === "saved" && (
                <>
                  <Check className="h-3 w-3" />
                  {t.journal.saved}
                </>
              )}
              {status === "error" && (
                <>
                  <AlertCircle className="h-3 w-3" />
                  {t.journal.saveFailed}
                </>
              )}
              {status === "offline" && (
                <>
                  <AlertCircle className="h-3 w-3" />
                  {t.journal.offline}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
