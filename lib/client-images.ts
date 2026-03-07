"use client";

import type { ImageOwnerKind } from "@/lib/types";

export async function uploadEncryptedImage(input: {
  file: File;
  ownerKind: ImageOwnerKind;
  ownerId: string;
}) {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("owner_kind", input.ownerKind);
  formData.append("owner_id", input.ownerId);

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
