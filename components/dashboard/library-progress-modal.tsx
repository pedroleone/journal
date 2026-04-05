"use client";

import { useState, useEffect, useId } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatMinutesAsTime,
  parseTimeToMinutes,
  deriveBookProgressPercent,
  normalizeBookMetadata,
} from "@/lib/library";
import type { BookFormat, BookMetadata } from "@/lib/library";

export function buildProgressPayload(
  bookFormat: BookFormat,
  progressDraft: string,
  totalDurationMinutes: number | null,
): { progressPercent: number } | { currentPage: number } | { currentMinutes: number } | null {
  if (bookFormat === "ebook") {
    const numericValue = Number(progressDraft);
    if (!Number.isFinite(numericValue)) return null;
    const progressPercent = Math.trunc(numericValue);
    if (progressPercent < 0 || progressPercent > 100) return null;
    return { progressPercent };
  }

  if (bookFormat === "physical") {
    const numericValue = Number(progressDraft);
    if (!Number.isFinite(numericValue)) return null;
    const currentPage = Math.trunc(numericValue);
    if (currentPage <= 0) return null;
    return { currentPage };
  }

  // audiobook
  if (totalDurationMinutes === null) return null;
  const remaining = parseTimeToMinutes(progressDraft);
  if (remaining === null || remaining < 0) return null;
  const currentMinutes = totalDurationMinutes - remaining;
  if (currentMinutes <= 0) return null;
  return { currentMinutes };
}

interface FetchedItem {
  id: string;
  title: string;
  creator: string | null;
  cover_image: string | null;
  metadata: Record<string, unknown> | null;
}

interface LibraryProgressModalProps {
  itemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LibraryProgressModal({
  itemId,
  open,
  onOpenChange,
  onSuccess,
}: LibraryProgressModalProps) {
  const [fetchedItem, setFetchedItem] = useState<FetchedItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressDraft, setProgressDraft] = useState("");
  const [thoughtDraft, setThoughtDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progressInputId = useId();

  useEffect(() => {
    if (!open || !itemId) {
      setFetchedItem(null);
      setProgressDraft("");
      setThoughtDraft("");
      setError(null);
      return;
    }
    setLoading(true);
    fetch(`/api/library/${encodeURIComponent(itemId)}`)
      .then((r) => r.json())
      .then((data: FetchedItem) => {
        setFetchedItem(data);
        const meta = normalizeBookMetadata(data.metadata);
        if (meta.bookFormat === "ebook") {
          setProgressDraft(meta.currentProgressPercent?.toString() ?? "");
        } else if (meta.bookFormat === "physical") {
          setProgressDraft(meta.currentProgressPage?.toString() ?? "");
        } else if (meta.bookFormat === "audiobook") {
          if (meta.totalDurationMinutes !== null && meta.currentProgressMinutes !== null) {
            setProgressDraft(formatMinutesAsTime(meta.totalDurationMinutes - meta.currentProgressMinutes));
          } else {
            setProgressDraft("");
          }
        }
      })
      .catch(() => setError("Failed to load item."))
      .finally(() => setLoading(false));
  }, [open, itemId]);

  async function handleSubmit() {
    if (!fetchedItem) return;
    const progressFilled = progressDraft.trim() !== "";
    const thoughtFilled = thoughtDraft.trim() !== "";
    if (!progressFilled && !thoughtFilled) return;

    setSubmitting(true);
    setError(null);
    try {
      if (progressFilled) {
        const meta = normalizeBookMetadata(fetchedItem.metadata);
        if (meta.bookFormat) {
          const payload = buildProgressPayload(meta.bookFormat, progressDraft.trim(), meta.totalDurationMinutes);
          if (payload) {
            const res = await fetch(`/api/library/${encodeURIComponent(fetchedItem.id)}/progress`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to update progress.");
          }
        }
      }
      if (thoughtFilled) {
        const res = await fetch(`/api/library/${encodeURIComponent(fetchedItem.id)}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: thoughtDraft.trim() }),
        });
        if (!res.ok) throw new Error("Failed to add thought.");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      void handleSubmit();
    }
  }

  const meta: BookMetadata | null = fetchedItem ? normalizeBookMetadata(fetchedItem.metadata) : null;
  const bookFormat = meta?.bookFormat ?? null;

  const progressPercent = meta
    ? bookFormat === "ebook"
      ? meta.currentProgressPercent
      : deriveBookProgressPercent(meta)
    : null;

  const primaryProgressValue = meta
    ? bookFormat === "physical"
      ? meta.currentProgressPage === null
        ? "0"
        : meta.totalPages === null
          ? String(meta.currentProgressPage)
          : `${meta.currentProgressPage} / ${meta.totalPages}`
      : bookFormat === "audiobook"
        ? meta.totalDurationMinutes === null
          ? null
          : meta.currentProgressMinutes === null
            ? formatMinutesAsTime(meta.totalDurationMinutes)
            : formatMinutesAsTime(meta.totalDurationMinutes - meta.currentProgressMinutes)
        : `${meta.currentProgressPercent ?? 0}%`
    : null;

  const progressLabel =
    bookFormat === "ebook" ? "Progress percent" :
    bookFormat === "audiobook" ? "Time remaining" :
    "Current page";

  const isSubmitDisabled =
    submitting ||
    (!progressDraft.trim() && !thoughtDraft.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Update progress</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-8 w-6 rounded-sm bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded bg-muted" />
                <div className="h-2.5 w-1/3 rounded bg-muted" />
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted" />
            <div className="h-8 w-full rounded-md bg-muted" />
            <div className="h-16 w-full rounded-md bg-muted" />
          </div>
        ) : fetchedItem ? (
          <div className="space-y-4" onKeyDown={handleKeyDown}>
            {/* Header: cover + title */}
            <div className="flex items-center gap-3">
              {fetchedItem.cover_image ? (
                <div className="h-10 w-7 shrink-0 overflow-hidden rounded-sm bg-muted">
                  <Image
                    src={`/api/images/${encodeURIComponent(fetchedItem.cover_image)}`}
                    alt=""
                    unoptimized
                    width={28}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-10 w-7 shrink-0 rounded-sm bg-muted" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight">{fetchedItem.title}</p>
                {fetchedItem.creator && (
                  <p className="truncate text-xs text-muted-foreground">{fetchedItem.creator}</p>
                )}
              </div>
            </div>

            {/* Progress display */}
            {bookFormat && primaryProgressValue !== null && (
              <div className="space-y-2">
                <p className="text-2xl font-semibold tracking-tight">{primaryProgressValue}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width]"
                    style={{ width: `${progressPercent ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Progress input */}
            {bookFormat && (
              <div>
                <label
                  htmlFor={progressInputId}
                  className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1"
                >
                  {progressLabel}
                </label>
                {bookFormat === "audiobook" ? (
                  <input
                    id={progressInputId}
                    type="text"
                    placeholder="2h 30min"
                    className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none"
                    value={progressDraft}
                    onChange={(e) => setProgressDraft(e.target.value)}
                    autoComplete="off"
                    data-1p-ignore
                  />
                ) : (
                  <input
                    id={progressInputId}
                    type="number"
                    min={bookFormat === "ebook" ? 0 : 1}
                    max={bookFormat === "ebook" ? 100 : (meta?.totalPages ?? undefined)}
                    className="w-full bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none"
                    value={progressDraft}
                    onChange={(e) => setProgressDraft(e.target.value)}
                    autoComplete="off"
                    data-1p-ignore
                  />
                )}
              </div>
            )}

            {/* Thought textarea */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-muted-foreground/60 mb-1">
                Add a thought
              </label>
              <textarea
                className="w-full resize-none bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground/40 min-h-[72px]"
                placeholder="Write a thought..."
                value={thoughtDraft}
                onChange={(e) => setThoughtDraft(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        ) : !error ? null : (
          <p className="text-sm text-muted-foreground">{error}</p>
        )}

        <DialogFooter showCloseButton>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitDisabled || loading || !fetchedItem}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background disabled:opacity-30 hover:opacity-80 transition-opacity"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
