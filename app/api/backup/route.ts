import { eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { bytesToBase64 } from "@/lib/base64";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { getEncryptedObject } from "@/lib/r2";
import { entries, foodEntries, mediaItems, mediaItemNotes } from "@/lib/schema";
import { decryptServerBuffer, decryptServerText } from "@/lib/server-crypto";
import type { BackupImageBlob, BackupPayloadV3 } from "@/lib/types";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const journalEntries = await db.select().from(entries).where(eq(entries.userId, userId));
  const foodRows = await db.select().from(foodEntries).where(eq(foodEntries.userId, userId));
  const libraryRows = await db.select().from(mediaItems).where(eq(mediaItems.userId, userId));
  const libraryNoteRows = await db.select().from(mediaItemNotes).where(eq(mediaItemNotes.userId, userId));

  const imageKeys = new Set<string>();
  for (const entry of journalEntries) {
    for (const key of entry.images ?? []) {
      imageKeys.add(key);
    }
  }
  for (const entry of foodRows) {
    for (const key of entry.images ?? []) {
      imageKeys.add(key);
    }
  }
  for (const item of libraryRows) {
    if (item.cover_image) imageKeys.add(item.cover_image);
  }
  for (const note of libraryNoteRows) {
    for (const key of note.images ?? []) {
      imageKeys.add(key);
    }
  }

  const imageBlobs: BackupImageBlob[] = [];
  for (const key of imageKeys) {
    const object = await getEncryptedObject(key);
    const decrypted = await decryptServerBuffer(object.body, object.iv);
    imageBlobs.push({
      key,
      content_type: object.contentType,
      data: bytesToBase64(decrypted),
    });
  }

  const payload: BackupPayloadV3 = {
    version: 3,
    exported_at: new Date().toISOString(),
    journal_entries: await Promise.all(
      journalEntries.map(async ({ encrypted_content, iv, ...entry }) => ({
        ...entry,
        content: await decryptServerText(encrypted_content, iv),
      })),
    ),
    food_entries: await Promise.all(
      foodRows.map(async ({ encrypted_content, iv, ...entry }) => ({
        ...entry,
        content: await decryptServerText(encrypted_content, iv),
      })),
    ),
    library_items: await Promise.all(
      libraryRows.map(async ({ encrypted_content, iv, ...item }) => ({
        ...item,
        content: encrypted_content && iv
          ? await decryptServerText(encrypted_content, iv)
          : null,
      })),
    ),
    library_notes: await Promise.all(
      libraryNoteRows.map(async ({ encrypted_content, iv, ...note }) => ({
        ...note,
        content: await decryptServerText(encrypted_content, iv),
      })),
    ),
    image_blobs: imageBlobs,
  };

  return jsonNoStore(payload);
}
