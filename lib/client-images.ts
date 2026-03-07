"use client";

import { base64ToBytes, bytesToArrayBuffer } from "@/lib/base64";
import { encryptBuffer } from "@/lib/crypto";
import { getUserKey } from "@/lib/key-manager";
import type { ImageOwnerKind } from "@/lib/types";

export async function uploadEncryptedImage(input: {
  file: File;
  ownerKind: ImageOwnerKind;
  ownerId: string;
}) {
  const key = getUserKey();
  if (!key) {
    throw new Error("No user key available");
  }

  const encrypted = await encryptBuffer(key, await input.file.arrayBuffer());
  const formData = new FormData();
  formData.append(
    "file",
    new File(
      [bytesToArrayBuffer(base64ToBytes(encrypted.ciphertext))],
      `${input.file.name || "image"}.enc`,
      { type: "application/octet-stream" },
    ),
  );
  formData.append("iv", encrypted.iv);
  formData.append("owner_kind", input.ownerKind);
  formData.append("owner_id", input.ownerId);
  formData.append("content_type", input.file.type || "image/jpeg");

  const response = await fetch("/api/images/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Image upload failed");
  }

  return response.json() as Promise<{ key: string; images: string[] }>;
}

export async function deleteEncryptedImage(input: {
  imageKey: string;
  ownerKind: ImageOwnerKind;
  ownerId: string;
}) {
  const response = await fetch(
    `/api/images/${encodeURIComponent(input.imageKey)}?owner_kind=${input.ownerKind}&owner_id=${input.ownerId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Image delete failed");
  }

  return response.json() as Promise<{ ok: true; images: string[] }>;
}
