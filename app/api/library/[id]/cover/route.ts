import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload-policy";
import { deleteEncryptedObject, putEncryptedObject } from "@/lib/r2";
import { mediaItems } from "@/lib/schema";
import { encryptServerBuffer } from "@/lib/server-crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;

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

  const [item] = await db
    .select({ id: mediaItems.id, cover_image: mediaItems.cover_image })
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));

  if (!item) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const key = `${userId}/library/${id}/${nanoid()}.enc`;
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
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));

  // Delete old cover if existed
  if (item.cover_image) {
    await deleteEncryptedObject(item.cover_image).catch(() => undefined);
  }

  return jsonNoStore({ key }, { status: 201 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;

  const [item] = await db
    .select({ id: mediaItems.id, cover_image: mediaItems.cover_image })
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));

  if (!item) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  if (!item.cover_image) {
    return jsonNoStore({ error: "No cover image" }, { status: 404 });
  }

  await deleteEncryptedObject(item.cover_image).catch(() => undefined);

  const now = new Date().toISOString();
  await db
    .update(mediaItems)
    .set({ cover_image: null, updated_at: now })
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));

  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}
