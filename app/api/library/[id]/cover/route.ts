import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";
import {
  withAuth,
  findOwned,
  notFoundResponse,
  deleteNoContent,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload-policy";
import { deleteEncryptedObject, putEncryptedObject } from "@/lib/r2";
import { mediaItems } from "@/lib/schema";
import { encryptServerBuffer } from "@/lib/server-crypto";

export const POST = withAuth<{ id: string }>(async (userId, request, { params }) => {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonNoStore({ error: "Missing file" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return jsonNoStore({ error: "Unsupported image type" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return jsonNoStore({ error: "Image exceeds 5 MB limit" }, { status: 413 });
  }

  const item = await findOwned(mediaItems, params.id, userId, {
    id: mediaItems.id,
    cover_image: mediaItems.cover_image,
  });
  if (!item) return notFoundResponse();

  const key = `${userId}/library/${params.id}/${nanoid()}.enc`;
  const body = new Uint8Array(await file.arrayBuffer());
  const encrypted = await encryptServerBuffer(body);

  await putEncryptedObject({
    key,
    body: encrypted.ciphertext,
    iv: encrypted.iv,
    contentType: file.type || "application/octet-stream",
  });

  const now = new Date().toISOString();
  await db
    .update(mediaItems)
    .set({ cover_image: key, updated_at: now })
    .where(and(eq(mediaItems.id, params.id), eq(mediaItems.userId, userId)));

  // Delete old cover if existed
  if (item.cover_image) {
    await deleteEncryptedObject(item.cover_image).catch(() => undefined);
  }

  return jsonNoStore({ key }, { status: 201 });
});

export const DELETE = withAuth<{ id: string }>(async (userId, _request, { params }) => {
  const item = await findOwned(mediaItems, params.id, userId, {
    id: mediaItems.id,
    cover_image: mediaItems.cover_image,
  });
  if (!item) return notFoundResponse();

  if (!item.cover_image) {
    return jsonNoStore({ error: "No cover image" }, { status: 404 });
  }

  await deleteEncryptedObject(item.cover_image).catch(() => undefined);

  const now = new Date().toISOString();
  await db
    .update(mediaItems)
    .set({ cover_image: null, updated_at: now })
    .where(and(eq(mediaItems.id, params.id), eq(mediaItems.userId, userId)));

  return deleteNoContent();
});
