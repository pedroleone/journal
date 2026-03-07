"use client";

import { useEffect, useState } from "react";

interface LoadedImage {
  key: string;
  url: string;
}

export function useImages(imageKeys: string[] | null | undefined) {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keys = imageKeys ?? [];

    if (!keys.length) {
      setImages([]);
      return;
    }

    let cancelled = false;
    const objectUrls: string[] = [];

    async function loadImages() {
      setLoading(true);

      try {
        const nextImages = await Promise.all(
          keys.map(async (imageKey) => {
            const response = await fetch(`/api/images/${encodeURIComponent(imageKey)}`);
            if (!response.ok) {
              throw new Error("Failed to fetch image");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            objectUrls.push(url);

            return {
              key: imageKey,
              url,
            };
          }),
        );

        if (!cancelled) {
          setImages(nextImages);
        }
      } catch {
        if (!cancelled) {
          setImages([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadImages();

    return () => {
      cancelled = true;
      for (const url of objectUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imageKeys]);

  return {
    images,
    loading,
  };
}
