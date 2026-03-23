"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { uploadEncryptedImage } from "@/lib/client-images";
import { useLocale } from "@/hooks/use-locale";
import type { MealSlot } from "@/lib/food";

interface FoodInlineComposerProps {
  year: number;
  month: number;
  day: number;
  mealSlot?: MealSlot;
  onSaved?: (foodEntryId: string) => void | Promise<void>;
}

async function readFoodCreateError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error.length > 0) {
      return data.error;
    }
  } catch {
    // Fall back to the generic message if the response body is not JSON.
  }

  return fallback;
}

export function FoodInlineComposer({
  year,
  month,
  day,
  mealSlot,
  onSaved,
}: FoodInlineComposerProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [logging, setLogging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pendingFoodEntryId, setPendingFoodEntryId] = useState<string | null>(null);
  const [pendingSaveCallbackRetry, setPendingSaveCallbackRetry] = useState(false);
  const [pendingUploadedAssets, setPendingUploadedAssets] = useState(false);
  const [pendingCreatedText, setPendingCreatedText] = useState(false);
  const isRetryingExistingEntry = pendingFoodEntryId !== null;
  const canRetryExistingEntry =
    pendingFoodEntryId !== null &&
    (pendingSaveCallbackRetry ||
      selectedFiles.length > 0 ||
      pendingUploadedAssets ||
      pendingCreatedText);

  async function handleLog() {
    if (pendingFoodEntryId) {
      if (!canRetryExistingEntry) return;
    } else if (!content.trim() && selectedFiles.length === 0) {
      return;
    }

    setLogging(true);
    setUploadError("");
    try {
      let foodEntryId = pendingFoodEntryId;

      if (!foodEntryId) {
        const response = await fetch("/api/food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            images: [],
            year,
            month,
            day,
            ...(mealSlot ? { meal_slot: mealSlot } : {}),
          }),
        });

        if (!response.ok) {
          throw new Error(await readFoodCreateError(response, "Failed to create food entry"));
        }

        const data = (await response.json()) as { id: string };
        foodEntryId = data.id;
        setPendingFoodEntryId(data.id);
        setPendingSaveCallbackRetry(false);
        setPendingUploadedAssets(false);
        setPendingCreatedText(content.trim().length > 0);
      }

      for (const file of [...selectedFiles]) {
        await uploadEncryptedImage({
          file,
          ownerKind: "food",
          ownerId: foodEntryId,
        });
        setPendingUploadedAssets(true);
        setSelectedFiles((current) => current.filter((currentFile) => currentFile !== file));
      }

      setPendingSaveCallbackRetry(true);
      await onSaved?.(foodEntryId);
      setContent("");
      setSelectedFiles([]);
      setPendingFoodEntryId(null);
      setPendingSaveCallbackRetry(false);
      setPendingUploadedAssets(false);
      setPendingCreatedText(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card/30 p-4">
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t.food.whatAreYouEating}
          rows={4}
          className="resize-none border-border/50 bg-background/70"
          disabled={logging || isRetryingExistingEntry}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          aria-label="Photo"
          disabled={logging || isRetryingExistingEntry}
          onChange={(event) => {
            setUploadError("");
            setSelectedFiles((current) => [...current, ...Array.from(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
        {selectedFiles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground"
              >
                {file.name}
                <button
                  onClick={() => {
                    setUploadError("");
                    setSelectedFiles((current) =>
                      current.filter((_, currentIndex) => currentIndex !== index),
                    );
                  }}
                  aria-label={`Remove ${file.name}`}
                  type="button"
                  disabled={logging}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
        <div className="flex items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            type="button"
            disabled={logging || isRetryingExistingEntry}
          >
            <Camera className="h-3.5 w-3.5" />
            Photo
          </button>
          <Button
            onClick={handleLog}
            disabled={
              logging ||
              (pendingFoodEntryId
                ? !canRetryExistingEntry
                : !content.trim() && selectedFiles.length === 0)
            }
          >
            {logging ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                {t.food.logging}
              </>
            ) : (
              t.food.log
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
