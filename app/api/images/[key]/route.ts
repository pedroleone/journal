import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { deleteEncryptedObject, getEncryptedObject } from "@/lib/r2";
import { db } from "@/lib/db";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { entries, foodEntries } from "@/lib/schema";
import { decryptServerBuffer } from "@/lib/server-crypto";
import { imageOwnerKindSchema } from "@/lib/validators";

async function ownerHasImage(
  userId: string,
  ownerKind: "journal" | "food",
  ownerId: string,
  key: string,
) {
  if (ownerKind === "journal") {
    const [record] = await db
      .select({ images: entries.images })
      .from(entries)
      .where(and(eq(entries.userId, userId), eq(entries.id, ownerId)));
    return record?.images?.includes(key) ?? false;
  }

  const [record] = await db
    .select({ images: foodEntries.images })
    .from(foodEntries)
    .where(and(eq(foodEntries.userId, userId), eq(foodEntries.id, ownerId)));
  return record?.images?.includes(key) ?? false;
}

async function updateOwnerImages(
  userId: string,
  ownerKind: "journal" | "food",
  ownerId: string,
  key: string,
) {
  const now = new Date().toISOString();

  if (ownerKind === "journal") {
    const [record] = await db
      .select({ images: entries.images })
      .from(entries)
      .where(and(eq(entries.userId, userId), eq(entries.id, ownerId)));
    const images = (record?.images ?? []).filter((imageKey) => imageKey !== key);
    await db
      .update(entries)
      .set({ images, updated_at: now })
      .where(and(eq(entries.userId, userId), eq(entries.id, ownerId)));
    return images;
  }

  const [record] = await db
    .select({ images: foodEntries.images })
    .from(foodEntries)
    .where(and(eq(foodEntries.userId, userId), eq(foodEntries.id, ownerId)));
  const images = (record?.images ?? []).filter((imageKey) => imageKey !== key);
  await db
    .update(foodEntries)
    .set({ images, updated_at: now })
    .where(and(eq(foodEntries.userId, userId), eq(foodEntries.id, ownerId)));
  return images;
}

function decodeKey(encodedKey: string) {
  return decodeURIComponent(encodedKey);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { key: rawKey } = await params;
  const key = decodeKey(rawKey);

  if (!key.startsWith(`${userId}/`)) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const [, ownerKind, ownerId] = key.split("/");
  const parsedOwnerKind = imageOwnerKindSchema.safeParse(ownerKind);
  if (!parsedOwnerKind.success || !ownerId) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const allowed = await ownerHasImage(userId, parsedOwnerKind.data, ownerId, key);
  if (!allowed) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const object = await getEncryptedObject(key);
  const decrypted = await decryptServerBuffer(object.body, object.iv);

  return new NextResponse(decrypted, {
    status: 200,
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": object.contentType,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const ownerKind = request.nextUrl.searchParams.get("owner_kind");
  const ownerId = request.nextUrl.searchParams.get("owner_id");
  const { key: rawKey } = await params;
  const key = decodeKey(rawKey);

  if (typeof ownerKind !== "string" || typeof ownerId !== "string") {
    return jsonNoStore({ error: "Missing owner info" }, { status: 400 });
  }

  const parsedOwnerKind = imageOwnerKindSchema.safeParse(ownerKind);
  if (!parsedOwnerKind.success) {
    return jsonNoStore({ error: "Invalid owner_kind" }, { status: 400 });
  }

  const allowed = await ownerHasImage(userId, parsedOwnerKind.data, ownerId, key);
  if (!allowed) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const images = await updateOwnerImages(userId, parsedOwnerKind.data, ownerId, key);
  await deleteEncryptedObject(key);

  return jsonNoStore({ ok: true, images });
}
