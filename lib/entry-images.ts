import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { deleteEncryptedObject, getEncryptedObject, putEncryptedObject } from "@/lib/r2";
import { entries, foodEntries, notes, noteSubnotes, mediaItems, mediaItemNotes } from "@/lib/schema";
import type { ImageOwnerKind } from "@/lib/types";

type OwnerImageRecord = {
  id: string;
  images: string[] | null;
};

type EntryRecord = typeof entries.$inferSelect | typeof foodEntries.$inferSelect;

type DeletedEncryptedObject = {
  key: string;
  body: Uint8Array;
  iv: string;
  contentType: string;
};

function getOwnerTable(ownerKind: "journal" | "food") {
  return ownerKind === "journal" ? entries : foodEntries;
}

export class ImageBlobCleanupError extends Error {
  deletedObjects: DeletedEncryptedObject[];
  cause?: unknown;

  constructor(message: string, deletedObjects: DeletedEncryptedObject[], cause?: unknown) {
    super(message);
    this.name = "ImageBlobCleanupError";
    this.deletedObjects = deletedObjects;
    this.cause = cause;
  }
}

export async function getOwnerImageRecord(
  userId: string,
  ownerKind: ImageOwnerKind,
  ownerId: string,
): Promise<OwnerImageRecord | null> {
  if (ownerKind === "note") {
    const [record] = await db
      .select({ id: notes.id, images: notes.images })
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.id, ownerId)));
    return record ?? null;
  }
  if (ownerKind === "note_subnote") {
    const [record] = await db
      .select({ id: noteSubnotes.id, images: noteSubnotes.images })
      .from(noteSubnotes)
      .where(and(eq(noteSubnotes.userId, userId), eq(noteSubnotes.id, ownerId)));
    return record ?? null;
  }
  if (ownerKind === "library") {
    const [record] = await db
      .select({ id: mediaItems.id, images: mediaItems.reactions })
      .from(mediaItems)
      .where(and(eq(mediaItems.userId, userId), eq(mediaItems.id, ownerId)));
    // mediaItems doesn't have an images column directly — use cover_image via a different path
    // For now, return null images since library items use cover_image not an images array
    return record ? { id: record.id, images: null } : null;
  }
  if (ownerKind === "library_note") {
    const [record] = await db
      .select({ id: mediaItemNotes.id, images: mediaItemNotes.images })
      .from(mediaItemNotes)
      .where(and(eq(mediaItemNotes.userId, userId), eq(mediaItemNotes.id, ownerId)));
    return record ?? null;
  }
  const table = getOwnerTable(ownerKind);
  const [record] = await db
    .select({ id: table.id, images: table.images })
    .from(table)
    .where(and(eq(table.userId, userId), eq(table.id, ownerId)));

  return record ?? null;
}

export async function setOwnerImages(
  userId: string,
  ownerKind: ImageOwnerKind,
  ownerId: string,
  images: string[],
) {
  const now = new Date().toISOString();
  if (ownerKind === "note") {
    await db
      .update(notes)
      .set({ images, updated_at: now })
      .where(and(eq(notes.userId, userId), eq(notes.id, ownerId)));
    return;
  }
  if (ownerKind === "note_subnote") {
    await db
      .update(noteSubnotes)
      .set({ images, updated_at: now })
      .where(and(eq(noteSubnotes.userId, userId), eq(noteSubnotes.id, ownerId)));
    return;
  }
  if (ownerKind === "library_note") {
    await db
      .update(mediaItemNotes)
      .set({ images, updated_at: now })
      .where(and(eq(mediaItemNotes.userId, userId), eq(mediaItemNotes.id, ownerId)));
    return;
  }
  if (ownerKind === "library") {
    // mediaItems doesn't have an images array column — no-op
    return;
  }
  const table = getOwnerTable(ownerKind);
  await db
    .update(table)
    .set({ images, updated_at: now })
    .where(and(eq(table.userId, userId), eq(table.id, ownerId)));
}

export async function getOwnerEntryRecord(
  userId: string,
  ownerKind: "journal" | "food",
  ownerId: string,
): Promise<EntryRecord | null> {
  const table = getOwnerTable(ownerKind);
  const [record] = await db
    .select()
    .from(table)
    .where(and(eq(table.userId, userId), eq(table.id, ownerId)));

  return record ?? null;
}

async function restoreOwnerEntryRecord(ownerKind: "journal" | "food", record: EntryRecord) {
  const table = getOwnerTable(ownerKind);
  await db.insert(table).values(record);
}

async function deleteOwnerEntryRecord(
  userId: string,
  ownerKind: "journal" | "food",
  ownerId: string,
) {
  const table = getOwnerTable(ownerKind);
  return db
    .delete(table)
    .where(and(eq(table.userId, userId), eq(table.id, ownerId)));
}

export async function deleteEncryptedObjectsWithBackup(imageKeys: string[]) {
  const deletedObjects: DeletedEncryptedObject[] = [];

  for (const key of imageKeys) {
    try {
      const object = await getEncryptedObject(key);
      await deleteEncryptedObject(key);
      deletedObjects.push({
        key,
        body: object.body,
        iv: object.iv,
        contentType: object.contentType,
      });
    } catch (error) {
      throw new ImageBlobCleanupError("Failed to delete encrypted image", deletedObjects, error);
    }
  }

  return deletedObjects;
}

export async function restoreDeletedObjects(objects: DeletedEncryptedObject[]) {
  for (const object of objects) {
    await putEncryptedObject({
      key: object.key,
      body: object.body,
      iv: object.iv,
      contentType: object.contentType,
    });
  }
}

export async function deleteOwnerEntryAndImages(
  userId: string,
  ownerKind: "journal" | "food",
  ownerId: string,
) {
  const entry = await getOwnerEntryRecord(userId, ownerKind, ownerId);
  if (!entry) {
    return { ok: false as const, reason: "not_found" as const };
  }

  const result = await deleteOwnerEntryRecord(userId, ownerKind, ownerId);
  if (result.rowsAffected === 0) {
    return { ok: false as const, reason: "not_found" as const };
  }

  try {
    await deleteEncryptedObjectsWithBackup(entry.images ?? []);
    return { ok: true as const };
  } catch (error) {
    await restoreOwnerEntryRecord(ownerKind, entry).catch(() => undefined);

    if (error instanceof ImageBlobCleanupError) {
      await restoreDeletedObjects(error.deletedObjects).catch(() => undefined);
    }

    return { ok: false as const, reason: "cleanup_failed" as const };
  }
}
