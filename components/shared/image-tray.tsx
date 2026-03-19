"use client";

import { useState, useRef } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useImages } from "@/hooks/use-images";
import { ImageLightbox } from "@/components/image-lightbox";

interface ImageTrayProps {
  imageKeys: string[];
  onAdd?: (files: FileList) => void;
  onRemove?: (key: string) => void;
  uploading?: boolean;
  disabled?: boolean;
}

export function ImageTray({
  imageKeys,
  onAdd,
  onRemove,
  uploading = false,
  disabled = false,
}: ImageTrayProps) {
  const { images, loading } = useImages(imageKeys);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {loading &&
          imageKeys.map((key) => (
            <div
              key={key}
              className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-md bg-muted"
            />
          ))}

        {images.map((img, i) => (
          <div key={img.key} className="relative shrink-0">
            <button
              onClick={() => setLightboxIndex(i)}
              className="overflow-hidden rounded-md border border-border/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="h-[72px] w-[72px] object-cover"
              />
            </button>
            {onRemove && !disabled && (
              <button
                onClick={() => onRemove(img.key)}
                className="absolute -right-1 -top-1 rounded-full bg-background/90 p-0.5 shadow-sm hover:bg-destructive hover:text-white"
                type="button"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {onAdd && !disabled && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  onAdd(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-md border border-dashed border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              type="button"
              aria-label="Add image"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </>
        )}
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
