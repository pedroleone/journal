"use client";

import { ImageOff } from "lucide-react";
import { useImages } from "@/hooks/use-images";
import { cn } from "@/lib/utils";

interface EncryptedImageGalleryProps {
  imageKeys: string[] | null | undefined;
  className?: string;
  imageClassName?: string;
}

export function EncryptedImageGallery({
  imageKeys,
  className,
  imageClassName,
}: EncryptedImageGalleryProps) {
  const { images, loading } = useImages(imageKeys);

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
          Loading images...
        </div>
      ) : null}
      {images.map((image) => (
        <div
          key={image.key}
          className="overflow-hidden rounded-lg border border-border/50 bg-card/30"
        >
          {/* Blob URLs back these images, so Next/Image is not a good fit here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
          Unable to load image
        </div>
      ) : null}
    </div>
  );
}
