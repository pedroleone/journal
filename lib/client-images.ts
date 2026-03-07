"use client";

import { prepareImageForUpload } from "@/lib/client-image-processing";
import type { ImageOwnerKind } from "@/lib/types";

async function getResponseErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error.length > 0) {
      return data.error;
    }
  } catch {
    // Ignore invalid error bodies and fall back to the default message.
  }

  return fallback;
}

export async function uploadEncryptedImage(input: {
  file: File;
  ownerKind: ImageOwnerKind;
  ownerId: string;
}) {
  const preparedFile = await prepareImageForUpload(input.file);
  const formData = new FormData();
  formData.append("file", preparedFile);
  formData.append("owner_kind", input.ownerKind);
  formData.append("owner_id", input.ownerId);

  const response = await fetch("/api/images/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, "Image upload failed"));
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
