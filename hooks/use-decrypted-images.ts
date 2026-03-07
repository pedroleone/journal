"use client";

import { useEffect, useState } from "react";
import { bytesToArrayBuffer, bytesToBase64 } from "@/lib/base64";
import { decryptBuffer } from "@/lib/crypto";
import { getKeyForSource } from "@/lib/key-manager";
import type { EntrySource } from "@/lib/types";

interface DecryptedImage {
  key: string;
  url: string;
}

export function useDecryptedImages(
  imageKeys: string[] | null | undefined,
  source: EntrySource,
) {
  const [images, setImages] = useState<DecryptedImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keys = imageKeys ?? [];

    if (!keys.length) {
      setImages([]);
      return;
    }

    const sourceKey = getKeyForSource(source);
    if (!sourceKey) {
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
              throw new Error("Failed to fetch encrypted image");
            }

            const iv = response.headers.get("X-Encryption-IV");
            if (!iv) {
              throw new Error("Missing image IV");
            }

            const originalContentType =
              response.headers.get("X-Original-Content-Type") ?? "image/jpeg";
            const encryptedBytes = new Uint8Array(await response.arrayBuffer());
            const decryptedBytes = await decryptBuffer(
              sourceKey as CryptoKey,
              bytesToBase64(encryptedBytes),
              iv,
            );
            const url = URL.createObjectURL(
              new Blob([bytesToArrayBuffer(decryptedBytes)], {
                type: originalContentType,
              }),
            );
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
  }, [imageKeys, source]);

  return {
    images,
    loading,
  };
}
