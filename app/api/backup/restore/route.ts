import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { base64ToBytes } from "@/lib/base64";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { putEncryptedObject } from "@/lib/r2";
import { entries, foodEntries } from "@/lib/schema";
import { encryptServerBuffer, encryptServerText } from "@/lib/server-crypto";
import { backupPayloadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const body = await request.json();
  const parsed = backupPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid backup payload" }, { status: 400 });
  }

  const skippedJournalIds: string[] = [];
  const skippedFoodIds: string[] = [];
  const skippedImageKeys: string[] = [];
  let importedJournal = 0;
  let importedFood = 0;
  let importedImages = 0;
  const imageKeyMap = new Map<string, string>();
  const existingReferencedKeys = new Set<string>();

  for (const image of parsed.data.image_blobs) {
    imageKeyMap.set(image.key, image.key.replace(/^[^/]+\//, `${userId}/`));
  }

  const existingJournalRows = await db
    .select({ images: entries.images })
    .from(entries)
    .where(eq(entries.userId, userId));
  for (const row of existingJournalRows) {
    for (const imageKey of row.images ?? []) {
      existingReferencedKeys.add(imageKey);
    }
  }
  const existingFoodRows = await db
    .select({ images: foodEntries.images })
    .from(foodEntries)
    .where(eq(foodEntries.userId, userId));
  for (const row of existingFoodRows) {
    for (const imageKey of row.images ?? []) {
      existingReferencedKeys.add(imageKey);
    }
  }

  for (const entry of parsed.data.journal_entries) {
    const existing = await db
      .select({ id: entries.id })
      .from(entries)
      .where(and(eq(entries.userId, userId), eq(entries.id, entry.id)));

    if (existing.length > 0) {
      skippedJournalIds.push(entry.id);
      continue;
    }

    const encrypted = await encryptServerText(entry.content);
    const { content, ...restEntry } = entry;
    void content;
    await db.insert(entries).values({
      ...restEntry,
      userId,
      encrypted_content: encrypted.ciphertext,
      iv: encrypted.iv,
      images:
        entry.images?.map((imageKey) => imageKeyMap.get(imageKey) ?? imageKey) ??
        null,
    });
    importedJournal += 1;
  }

  for (const entry of parsed.data.food_entries) {
    const existing = await db
      .select({ id: foodEntries.id })
      .from(foodEntries)
      .where(and(eq(foodEntries.userId, userId), eq(foodEntries.id, entry.id)));

    if (existing.length > 0) {
      skippedFoodIds.push(entry.id);
      continue;
    }

    const encrypted = await encryptServerText(entry.content);
    const { content, meal_slot, ...restEntry } = entry;
    void content;
    const mappedSlot = meal_slot === "snack" ? "afternoon_snack" : meal_slot;
    await db.insert(foodEntries).values({
      ...restEntry,
      meal_slot: mappedSlot,
      userId,
      encrypted_content: encrypted.ciphertext,
      iv: encrypted.iv,
      images:
        entry.images?.map((imageKey) => imageKeyMap.get(imageKey) ?? imageKey) ??
        null,
    });
    importedFood += 1;
  }

  for (const image of parsed.data.image_blobs) {
    const remappedKey = imageKeyMap.get(image.key) ?? image.key;
    if (existingReferencedKeys.has(remappedKey)) {
      skippedImageKeys.push(remappedKey);
      continue;
    }

    try {
      const encrypted = await encryptServerBuffer(base64ToBytes(image.data));
      await putEncryptedObject({
        key: remappedKey,
        body: encrypted.ciphertext,
        iv: encrypted.iv,
        contentType: image.content_type,
      });
      importedImages += 1;
      existingReferencedKeys.add(remappedKey);
    } catch {
      skippedImageKeys.push(remappedKey);
    }
  }

  return jsonNoStore({
    imported_journal: importedJournal,
    skipped_journal_ids: skippedJournalIds,
    imported_food: importedFood,
    skipped_food_ids: skippedFoodIds,
    imported_images: importedImages,
    skipped_image_keys: skippedImageKeys,
  });
}
