"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { useImages } from "@/hooks/use-images";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/image-lightbox";

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!imageKeys?.length) return null;

  return (
    <>
      <div
        className={cn(
          "flex flex-row gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible",
          className,
        )}
      >
        {loading && images.length === 0
          ? Array.from({ length: imageKeys.length }).map((_, i) => (
              <div
                key={i}
                className="h-14 w-14 shrink-0 animate-pulse rounded-md bg-muted md:h-20 md:w-full"
              />
            ))
          : null}

        {images.map((image, i) => (
          <button
            key={image.key}
            onClick={() => setLightboxIndex(i)}
            className="shrink-0 overflow-hidden rounded-md border border-border/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`View image ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              className={cn("h-14 w-14 object-cover md:h-20 md:w-full", imageClassName)}
            />
          </button>
        ))}

        {!loading && images.length === 0 ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border/60 bg-card/20 md:h-20 md:w-full">
            <ImageOff className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : null}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
