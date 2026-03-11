"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: { key: string; url: string }[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

export function ImageLightbox({ images, index, onIndexChange, onClose }: ImageLightboxProps) {
  const prev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const next = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, onClose]);

  const image = images[index];
  if (!image) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-white/70">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main image area */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 z-10 rounded-full bg-black/40 p-2 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt=""
          className="max-h-full max-w-full object-contain"
        />

        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-3 z-10 rounded-full bg-black/40 p-2 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="flex shrink-0 items-center gap-2 overflow-x-auto px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={img.key}
              onClick={() => onIndexChange(i)}
              className={`shrink-0 overflow-hidden rounded transition-opacity ${
                i === index ? "ring-2 ring-white opacity-100" : "opacity-50 hover:opacity-80"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-14 w-14 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
