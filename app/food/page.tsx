"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EncryptedImageGallery } from "@/components/encrypted-image-gallery";
import { uploadEncryptedImage } from "@/lib/client-images";

interface FoodEntry {
  id: string;
  source: "web" | "telegram";
  content: string;
  logged_at: string;
  images: string[] | null;
}

interface RecentEntry {
  id: string;
  source: "web" | "telegram";
  content: string;
  logged_at: string;
  images: string[] | null;
}

function formatLoggedAt(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FoodPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState("");
  const [logging, setLogging] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [savedFlash, setSavedFlash] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState("");

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch("/api/food?uncategorized=true&limit=5");
      if (!res.ok) return;
      const raw: FoodEntry[] = await res.json();
      setRecent(raw);
    } catch {
      // Ignore feed failures to keep quick-log usable.
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  async function handleLog() {
    if (!content.trim() && selectedFiles.length === 0) return;

    setLogging(true);
    setUploadError("");
    try {
      const res = await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          images: [],
        }),
      });
      if (!res.ok) return;

      const data = await res.json();

      for (const file of selectedFiles) {
        await uploadEncryptedImage({
          file,
          ownerKind: "food",
          ownerId: data.id,
        });
      }

      setContent("");
      setSelectedFiles([]);
      setUploadError("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
      await loadRecent();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="animate-page mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/food/browse?mode=food">Browse & Organize</Link>
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border border-border/60 bg-card/30 p-4 sm:p-6">
        <h1 className="font-display text-2xl tracking-tight">Quick Food Log</h1>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are you eating?"
          rows={4}
          className="resize-none border-border/50 bg-background/70"
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
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {uploadError ? (
          <p className="text-sm text-destructive">{uploadError}</p>
        ) : null}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                setUploadError("");
                setSelectedFiles((current) => [
                  ...current,
                  ...Array.from(event.target.files ?? []),
                ]);
                event.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              type="button"
            >
              <Camera className="h-3.5 w-3.5" />
              Photo
            </button>
            <span>One field, one tap.</span>
          </div>
          <Button
            onClick={handleLog}
            disabled={logging || (!content.trim() && selectedFiles.length === 0)}
          >
            {logging ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              "Log"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent uncategorized
          </h2>
          {savedFlash && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No food logs yet.</p>
        ) : (
          <div className="space-y-3">
            {recent.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-border/50 bg-card/20 px-3 py-3"
              >
                {entry.content ? (
                  <p className="text-sm leading-relaxed">{entry.content}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">Photo entry</p>
                )}
                {entry.images?.length ? (
                  <EncryptedImageGallery
                    imageKeys={entry.images}
                    className="mt-3"
                    imageClassName="h-32"
                  />
                ) : null}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {formatLoggedAt(entry.logged_at)}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/food/entry/${entry.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
