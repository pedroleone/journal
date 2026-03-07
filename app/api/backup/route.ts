import { eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { bytesToBase64 } from "@/lib/base64";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { getEncryptedObject } from "@/lib/r2";
import { entries, foodEntries } from "@/lib/schema";
import type { BackupImageBlob, BackupPayloadV1 } from "@/lib/types";

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
    imageBlobs.push({
      key,
      iv: object.iv,
      content_type: object.contentType,
      data: bytesToBase64(object.body),
    });
  }

  const payload: BackupPayloadV1 = {
    version: 1,
    exported_at: new Date().toISOString(),
    journal_entries: journalEntries,
    food_entries: foodRows,
    image_blobs: imageBlobs,
  };

  return jsonNoStore(payload);
}
