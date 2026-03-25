"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { useImages } from "@/hooks/use-images";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { deleteEncryptedImage, uploadEncryptedImage } from "@/lib/client-images";
import { useLocale } from "@/hooks/use-locale";
import type { MealSlot } from "@/lib/food";

interface FoodEntry {
  id: string;
  source: "web";
  year: number;
  month: number;
  day: number;
  hour: number | null;
  meal_slot: MealSlot | null;
  logged_at: string;
  content: string;
  images: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

function formatLoggedAt(iso: string, localeCode: string) {
  return new Date(iso).toLocaleString(localeCode, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getSafeReturnTo(value: string | null) {
  if (!value) return "/food";

  try {
    const url = new URL(value, "http://localhost");
    if (url.origin !== "http://localhost" || url.pathname !== "/food") {
      return "/food";
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return "/food";
  }
}

export default function FoodEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [entry, setEntry] = useState<FoodEntry | null>(null);
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [readyForViewing, setReadyForViewing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const isOnline = useOnlineStatus();
  const { images } = useImages(imageKeys);

  useEffect(() => {
    if (!isOnline) return;

    fetch(`/api/food/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: FoodEntry) => {
        setEntry(data);
        setImageKeys(data.images ?? []);
        setEditContent(data.content);
        setLoading(false);
        if (searchParams.get("edit") === "true") {
          setEditing(true);
        }
      })
      .catch(() => {
        setLoading(false);
        setError("Failed to load food entry");
      })
      .finally(() => {
        setReadyForViewing(true);
      });
  }, [id, isOnline, searchParams]);

  async function handleSaveEdit() {
    if (!entry || !isOnline) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/food/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEntry({ ...entry, content: editContent });
      setEditing(false);
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (entry) setEditContent(entry.content);
    setEditing(false);
  }

  async function handleImageSelection(files: FileList | null) {
    if (!files?.length || !entry || !isOnline) return;

    setUploadingImages(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const result = await uploadEncryptedImage({
          file,
          ownerKind: "food",
          ownerId: entry.id,
        });
        setImageKeys(result.images);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveImage(imageKey: string) {
    if (!entry || !isOnline) return;

    try {
      const result = await deleteEncryptedImage({
        imageKey,
        ownerKind: "food",
        ownerId: entry.id,
      });
      setImageKeys(result.images);
    } catch {
      setError("Failed to remove image");
    }
  }

  async function handleDelete() {
    if (!entry || !isOnline) return;

    setDeletingEntry(true);
    setError("");
    try {
      const response = await fetch(`/api/food/${entry.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete entry");
      }

      router.push(returnTo);
    } catch {
      setError("Failed to delete food entry");
    } finally {
      setDeletingEntry(false);
    }
  }

  if (!isOnline && !readyForViewing) {
    return (
      <div className="mx-auto flex min-h-full max-w-md items-center justify-center px-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl tracking-tight">Connection required</h1>
          <p className="text-sm text-muted-foreground">
            The installed app opens offline, but loading or changing a food entry still requires a connection.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="animate-page mx-auto max-w-2xl px-6 py-10">
        <p className="text-muted-foreground">Food entry not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(returnTo)}
        >
          Back to Food
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-page mx-auto max-w-2xl space-y-8 px-6 py-10">
      {!isOnline && (
        <div className="rounded-lg border border-border/60 bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
          You are offline. This entry stays visible, but image changes and deletes are unavailable until you reconnect.
        </div>
      )}

      <button
        onClick={() => router.push(returnTo)}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Back
      </button>

      <div className="space-y-2">
        <h1 className="font-display text-2xl tracking-tight">Food Entry</h1>
        <p className="text-sm text-muted-foreground">{formatLoggedAt(entry.logged_at, t.localeCode)}</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {editing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[120px]"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveEdit} disabled={saving || !editContent.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          {entry.content ? (
            <div className="whitespace-pre-wrap text-base leading-relaxed">{entry.content}</div>
          ) : null}
          {!entry.tags?.includes("skipped") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditContent(entry.content);
                setEditing(true);
              }}
              disabled={!isOnline}
            >
              Edit
            </Button>
          )}
        </>
      )}

      {images.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <div
              key={image.key}
              className="relative overflow-hidden rounded-lg border border-border/50 bg-card/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="h-48 w-full object-cover" />
              <button
                onClick={() => handleRemoveImage(image.key)}
                className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground shadow-sm"
                aria-label="Remove image"
                disabled={!isOnline}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
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
            Add images
          </button>
          {imageKeys.length > 0 ? (
            <span className="text-xs text-muted-foreground">{imageKeys.length} attached</span>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
          disabled={!isOnline || deletingEntry}
        >
          {deletingEntry ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete food entry"
        description="This food entry will be permanently deleted. This action cannot be undone."
      />
    </div>
  );
}
