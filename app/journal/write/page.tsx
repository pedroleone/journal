"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useImages } from "@/hooks/use-images";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useMediaQuery } from "@/hooks/use-media-query";
import { deleteEncryptedImage, uploadEncryptedImage } from "@/lib/client-images";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { DateTree, type DateSelection } from "@/components/journal/date-tree";
import { useLocale } from "@/hooks/use-locale";

function formatWriteDate(date: Date, localeCode: string): string {
  return date.toLocaleDateString(localeCode, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface DateEntry {
  id: string;
  year: number;
  month: number;
  day: number;
}

interface JournalEntryResponse {
  id: string;
  source: "web" | "telegram";
  year: number;
  month: number;
  day: number;
  content: string;
  images: string[] | null;
}

export default function WritePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editEntryId = searchParams.get("entry");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date());
  const [dates, setDates] = useState<DateEntry[]>([]);
  const [loadedEntryId, setLoadedEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [readyForEditing, setReadyForEditing] = useState(false);
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [entryError, setEntryError] = useState("");
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
      if (entry.source !== "web") {
        setEntryError(t.journal.telegramCannotEdit);
        setContent("");
        setImageKeys(entry.images ?? []);
        setLoadedEntryId(null);
        return;
      }

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
      const webEntry = entries.find((entry) => entry.source === "web");

      if (webEntry) {
        setContent(webEntry.content);
        setLoadedEntryId(webEntry.id);
        setImageKeys(webEntry.images ?? []);
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
    if (!isOnline) return;
    let cancelled = false;
    fetch("/api/entries/dates")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { if (!cancelled) setDates(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOnline]);

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

  function handleNewThought() {
    const time = new Date().toLocaleTimeString(t.localeCode, {
      hour: "numeric",
      minute: "2-digit",
    });
    setContent((prev) => `${prev}\n\n---\n\n*${time}*\n\n`);
  }

  if (!isOnline && !readyForEditing) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center px-6">
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
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex">
      {!isMobile && (
        <div className="sticky top-14 self-start h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto">
        <CollapsibleSidebar visible={false}>
          <DateTree
            dates={dates}
            selected={{ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }}
            onSelect={(sel: DateSelection) => {
              if (sel.day != null && sel.month != null) {
                if (editEntryId) {
                  router.replace("/journal/write");
                }
                setDate(new Date(sel.year, sel.month - 1, sel.day));
              }
            }}
            onExport={() => router.push("/export")}
          />
        </CollapsibleSidebar>
        </div>
      )}
      <div className="flex flex-1 flex-col">
      {!isOnline && (
        <div className="border-b border-border/60 bg-secondary/60 px-6 py-2 text-center text-sm text-muted-foreground">
          {t.journal.offlineChanges}
        </div>
      )}
      <div className="mx-auto w-full max-w-3xl px-6">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/journal/browse"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.journal.back}
          </Link>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button className="font-display text-lg tracking-tight text-foreground transition-colors hover:text-muted-foreground">
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
                    setCalendarOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>

          <div className="w-16" />
        </div>

        {entryError ? (
          <div className="pb-2 text-sm text-destructive">{entryError}</div>
        ) : null}

        <div className="pb-4">
          <MarkdownEditor
            value={content}
            onChange={setContent}
            onBlur={() => { void save(); }}
            placeholder={t.journal.startWriting}
            className="text-base leading-relaxed"
            minHeight="calc(100vh - 12rem)"
            autoFocus
          />

          {images.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {images.map((image) => (
                <div
                  key={image.key}
                  className="relative overflow-hidden rounded-lg border border-border/50 bg-card/20"
                >
                  {/* Blob URLs back these previews, so Next/Image is not a good fit here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="" className="h-48 w-full object-cover" />
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
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-border/40 py-3 bg-background/95 backdrop-blur-sm">
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
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              disabled={!content.trim()}
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
      </div>
      </div>
    </div>
  );
}
