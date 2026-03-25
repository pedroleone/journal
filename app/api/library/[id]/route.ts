import { and, asc, eq } from "drizzle-orm";
import {
  withAuth,
  parseBody,
  findOwned,
  notFoundResponse,
  deleteNoContent,
  readEncryptedContentList,
  readOptionalEncryptedContent,
  storeOptionalEncryptedContent,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { mediaItems, mediaItemNotes } from "@/lib/schema";
import { computeStatusTimestamps } from "@/lib/library";
import { updateMediaItemSchema } from "@/lib/validators";
import { deleteEncryptedObjectsWithBackup } from "@/lib/entry-images";

export const GET = withAuth<{ id: string }>(async (userId, _request, { params }) => {
  const item = await findOwned(mediaItems, params.id, userId);
  if (!item) return notFoundResponse();

  const noteResults = await db
    .select()
    .from(mediaItemNotes)
    .where(and(eq(mediaItemNotes.mediaItemId, params.id), eq(mediaItemNotes.userId, userId)))
    .orderBy(asc(mediaItemNotes.created_at));

  const decryptedItem = await readOptionalEncryptedContent(item);
  const decryptedNotes = await readEncryptedContentList(noteResults);

  return jsonNoStore({ ...decryptedItem, notes: decryptedNotes });
});

export const PUT = withAuth<{ id: string }>(async (userId, request, { params }) => {
  const parsed = await parseBody(request, updateMediaItemSchema);
  if (!parsed.success) return parsed.response;

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { updated_at: now };

  // Auto-timestamps: compute before explicit values so user-provided timestamps override
  if ("status" in parsed.data && parsed.data.status) {
    const [current] = await db
      .select({ started_at: mediaItems.started_at, finished_at: mediaItems.finished_at })
      .from(mediaItems)
      .where(and(eq(mediaItems.id, params.id), eq(mediaItems.userId, userId)));
    if (current) {
      const autoTs = computeStatusTimestamps(
        parsed.data.status,
        { started_at: current.started_at, finished_at: current.finished_at },
        now,
      );
      if (autoTs.started_at) updateData.started_at = autoTs.started_at;
      if (autoTs.finished_at) updateData.finished_at = autoTs.finished_at;
    }
    updateData.status = parsed.data.status;
  }

  if ("title" in parsed.data) updateData.title = parsed.data.title;
  if ("creator" in parsed.data) updateData.creator = parsed.data.creator ?? null;
  if ("url" in parsed.data) updateData.url = parsed.data.url ?? null;
  if ("rating" in parsed.data) updateData.rating = parsed.data.rating ?? null;
  if ("reactions" in parsed.data) updateData.reactions = parsed.data.reactions ?? null;
  if ("genres" in parsed.data) updateData.genres = parsed.data.genres ?? null;
  if ("metadata" in parsed.data) updateData.metadata = parsed.data.metadata ?? null;
  // Explicit timestamps override auto-timestamps
  if ("started_at" in parsed.data) updateData.started_at = parsed.data.started_at ?? null;
  if ("finished_at" in parsed.data) updateData.finished_at = parsed.data.finished_at ?? null;

  if (parsed.data.content !== undefined) {
    const encrypted = await storeOptionalEncryptedContent(parsed.data.content);
    Object.assign(updateData, encrypted);
  }

  const result = await db
    .update(mediaItems)
    .set(updateData)
    .where(and(eq(mediaItems.id, params.id), eq(mediaItems.userId, userId)));

  if (result.rowsAffected === 0) return notFoundResponse();

  return jsonNoStore({ ok: true });
});

export const DELETE = withAuth<{ id: string }>(async (userId, _request, { params }) => {
  const itemRecord = await findOwned(mediaItems, params.id, userId);
  if (!itemRecord) return notFoundResponse();

  const noteRecords = await db
    .select()
    .from(mediaItemNotes)
    .where(and(eq(mediaItemNotes.mediaItemId, params.id), eq(mediaItemNotes.userId, userId)));

  const allImageKeys = [
    ...(itemRecord.cover_image ? [itemRecord.cover_image] : []),
    ...noteRecords.flatMap((n) => n.images ?? []),
  ];

  const deleteResult = await db
    .delete(mediaItems)
    .where(and(eq(mediaItems.id, params.id), eq(mediaItems.userId, userId)));

  if (deleteResult.rowsAffected === 0) return notFoundResponse();

  await deleteEncryptedObjectsWithBackup(allImageKeys).catch(() => undefined);

  return deleteNoContent();
});
