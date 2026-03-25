import { and, eq } from "drizzle-orm";
import {
  withAuth,
  parseBody,
  findOwned,
  notFoundResponse,
  deleteNoContent,
  storeEncryptedContent,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { mediaItemNotes } from "@/lib/schema";
import { updateMediaItemNoteSchema } from "@/lib/validators";
import { deleteEncryptedObjectsWithBackup } from "@/lib/entry-images";

export const PUT = withAuth<{ id: string; noteId: string }>(async (userId, request, { params }) => {
  const parsed = await parseBody(request, updateMediaItemNoteSchema);
  if (!parsed.success) return parsed.response;

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { updated_at: now };

  if ("images" in parsed.data) updateData.images = parsed.data.images ?? null;

  if (parsed.data.content !== undefined) {
    const encrypted = await storeEncryptedContent(parsed.data.content);
    Object.assign(updateData, encrypted);
  }

  const result = await db
    .update(mediaItemNotes)
    .set(updateData)
    .where(and(eq(mediaItemNotes.id, params.noteId), eq(mediaItemNotes.userId, userId)));

  if (result.rowsAffected === 0) return notFoundResponse();

  return jsonNoStore({ ok: true });
});

export const DELETE = withAuth<{ id: string; noteId: string }>(async (userId, _request, { params }) => {
  const note = await findOwned(mediaItemNotes, params.noteId, userId);
  if (!note) return notFoundResponse();

  const deleteResult = await db
    .delete(mediaItemNotes)
    .where(and(eq(mediaItemNotes.id, params.noteId), eq(mediaItemNotes.userId, userId)));

  if (deleteResult.rowsAffected === 0) return notFoundResponse();

  await deleteEncryptedObjectsWithBackup(note.images ?? []).catch(() => undefined);

  return deleteNoContent();
});
