import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { jsonNoStore } from "@/lib/http";
import { deleteEncryptedObject, putEncryptedObject } from "@/lib/r2";
import { entries, foodEntries } from "@/lib/schema";
import { db } from "@/lib/db";
import { encryptServerBuffer } from "@/lib/server-crypto";
import { imageOwnerKindSchema } from "@/lib/validators";

async function getOwnerRecord(userId: string, ownerKind: "journal" | "food", ownerId: string) {
  if (ownerKind === "journal") {
    const [record] = await db
      .select({ id: entries.id, images: entries.images })
      .from(entries)
      .where(and(eq(entries.userId, userId), eq(entries.id, ownerId)));
    return record ?? null;
  }

  const [record] = await db
    .select({ id: foodEntries.id, images: foodEntries.images })
    .from(foodEntries)
    .where(and(eq(foodEntries.userId, userId), eq(foodEntries.id, ownerId)));
  return record ?? null;
}

async function updateOwnerImages(
  userId: string,
  ownerKind: "journal" | "food",
  ownerId: string,
  images: string[],
) {
  const now = new Date().toISOString();

  if (ownerKind === "journal") {
    await db
      .update(entries)
      .set({ images, updated_at: now })
      .where(and(eq(entries.userId, userId), eq(entries.id, ownerId)));
    return;
  }

  await db
    .update(foodEntries)
    .set({ images, updated_at: now })
    .where(and(eq(foodEntries.userId, userId), eq(foodEntries.id, ownerId)));
}

export async function POST(request: Request) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const formData = await request.formData();
  const file = formData.get("file");
  const ownerKind = formData.get("owner_kind");
  const ownerId = formData.get("owner_id");

  if (!(file instanceof File) || typeof ownerKind !== "string" || typeof ownerId !== "string") {
    return jsonNoStore({ error: "Invalid form data" }, { status: 400 });
  }

  const parsedOwnerKind = imageOwnerKindSchema.safeParse(ownerKind);
  if (!parsedOwnerKind.success) {
    return jsonNoStore({ error: "Invalid owner_kind" }, { status: 400 });
  }

  const record = await getOwnerRecord(userId, parsedOwnerKind.data, ownerId);
  if (!record) {
    return jsonNoStore({ error: "Owner not found" }, { status: 404 });
  }

  const key = `${userId}/${parsedOwnerKind.data}/${ownerId}/${nanoid()}.enc`;
  const body = new Uint8Array(await file.arrayBuffer());
  const encrypted = await encryptServerBuffer(body);
  const nextImages = [...(record.images ?? []), key];

  try {
    await putEncryptedObject({
      key,
      body: encrypted.ciphertext,
      iv: encrypted.iv,
      contentType: file.type || "application/octet-stream",
    });
    await updateOwnerImages(userId, parsedOwnerKind.data, ownerId, nextImages);
  } catch (error) {
    await deleteEncryptedObject(key).catch(() => undefined);
    throw error;
  }

  return jsonNoStore({ key, images: nextImages }, { status: 201 });
}
