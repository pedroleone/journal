import { eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { bytesToBase64 } from "@/lib/base64";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { getEncryptedObject } from "@/lib/r2";
import { entries, foodEntries } from "@/lib/schema";
import { decryptServerBuffer, decryptServerText } from "@/lib/server-crypto";
import type { BackupImageBlob, BackupPayloadV2 } from "@/lib/types";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const journalEntries = await db.select().from(entries).where(eq(entries.userId, userId));
  const foodRows = await db.select().from(foodEntries).where(eq(foodEntries.userId, userId));

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

  const payload: BackupPayloadV2 = {
    version: 2,
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
    image_blobs: imageBlobs,
  };

  return jsonNoStore(payload);
}
