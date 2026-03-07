"use client";

import { ImageOff } from "lucide-react";
import { useDecryptedImages } from "@/hooks/use-decrypted-images";
import { cn } from "@/lib/utils";
import type { EntrySource } from "@/lib/types";

interface EncryptedImageGalleryProps {
  imageKeys: string[] | null | undefined;
  source: EntrySource;
  className?: string;
  imageClassName?: string;
}

export function EncryptedImageGallery({
  imageKeys,
  source,
  className,
  imageClassName,
}: EncryptedImageGalleryProps) {
  const { images, loading } = useDecryptedImages(imageKeys, source);

  if (!imageKeys?.length) return null;

  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        className,
      )}
    >
      {loading && images.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/20 text-sm text-muted-foreground">
          Decrypting images...
        </div>
      ) : null}
      {images.map((image) => (
        <div
          key={image.key}
          className="overflow-hidden rounded-lg border border-border/50 bg-card/30"
        >
          <img
            src={image.url}
            alt=""
            className={cn("h-48 w-full object-cover", imageClassName)}
          />
        </div>
      ))}
      {!loading && images.length === 0 ? (
        <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/20 text-sm text-muted-foreground">
          <ImageOff className="mr-2 h-4 w-4" />
          Unable to decrypt image
        </div>
      ) : null}
    </div>
  );
}
