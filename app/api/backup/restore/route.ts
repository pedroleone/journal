import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { base64ToBytes } from "@/lib/base64";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { putEncryptedObject } from "@/lib/r2";
import { entries, foodEntries, mediaItems, mediaItemNotes } from "@/lib/schema";
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

  // Library items & notes (V3)
  const skippedLibraryIds: string[] = [];
  let importedLibrary = 0;
  let importedLibraryNotes = 0;

  const libraryItems = "library_items" in parsed.data ? parsed.data.library_items : [];
  const libraryNotes = "library_notes" in parsed.data ? parsed.data.library_notes : [];

  for (const item of libraryItems) {
    const existing = await db
      .select({ id: mediaItems.id })
      .from(mediaItems)
      .where(and(eq(mediaItems.userId, userId), eq(mediaItems.id, item.id)));

    if (existing.length > 0) {
      skippedLibraryIds.push(item.id);
      continue;
    }

    const { content, cover_image, type, status, ...restItem } = item;
    let encrypted_content: string | null = null;
    let iv: string | null = null;
    if (content) {
      const enc = await encryptServerText(content);
      encrypted_content = enc.ciphertext;
      iv = enc.iv;
    }

    const remappedCover = cover_image ? (imageKeyMap.get(cover_image) ?? cover_image) : null;

    await db.insert(mediaItems).values({
      ...restItem,
      type: type as "book" | "album" | "movie" | "game" | "video" | "misc",
      status: status as "backlog" | "in_progress" | "finished" | "dropped",
      userId,
      cover_image: remappedCover,
      encrypted_content,
      iv,
    });
    importedLibrary += 1;
  }

  for (const note of libraryNotes) {
    const enc = await encryptServerText(note.content);
    const { content, ...restNote } = note;
    void content;

    await db.insert(mediaItemNotes).values({
      ...restNote,
      userId,
      encrypted_content: enc.ciphertext,
      iv: enc.iv,
      images: note.images?.map((k) => imageKeyMap.get(k) ?? k) ?? null,
    });
    importedLibraryNotes += 1;
  }

  return jsonNoStore({
    imported_journal: importedJournal,
    skipped_journal_ids: skippedJournalIds,
    imported_food: importedFood,
    skipped_food_ids: skippedFoodIds,
    imported_images: importedImages,
    skipped_image_keys: skippedImageKeys,
    imported_library: importedLibrary,
    skipped_library_ids: skippedLibraryIds,
    imported_library_notes: importedLibraryNotes,
  });
}
