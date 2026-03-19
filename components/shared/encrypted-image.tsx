"use client";

import { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface EncryptedImageProps {
  imageKey: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const SIZE_CLASSES = {
  sm: "h-[72px] w-[72px]",
  md: "h-20 w-20",
  lg: "h-48 w-full",
};

export function EncryptedImage({
  imageKey,
  alt = "",
  size = "sm",
  className,
  onClick,
}: EncryptedImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    fetch(`/api/images/${encodeURIComponent(imageKey)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageKey]);

  const sizeClass = SIZE_CLASSES[size];

  if (loading) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-md bg-muted shrink-0",
          sizeClass,
          className,
        )}
      />
    );
  }

  if (error || !url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-dashed border-border/60 bg-card/20 shrink-0",
          sizeClass,
          className,
        )}
      >
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 overflow-hidden rounded-md border border-border/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        onClick ? "cursor-pointer" : "cursor-default",
        className,
      )}
      type="button"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className={cn("object-cover", sizeClass)} />
    </button>
  );
}
