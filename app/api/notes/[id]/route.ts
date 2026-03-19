import { and, asc, eq } from "drizzle-orm";
import {
  withAuth,
  parseBody,
  findOwned,
  notFoundResponse,
  deleteNoContent,
  encryptContentFields,
  decryptRecord,
  decryptRecords,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { notes, noteSubnotes } from "@/lib/schema";
import { updateNoteSchema } from "@/lib/validators";
import { deleteEncryptedObjectsWithBackup } from "@/lib/entry-images";

export const GET = withAuth<{ id: string }>(async (userId, _request, { params }) => {
  const noteResult = await findOwned(notes, params.id, userId);
  if (!noteResult) return notFoundResponse();

  const subnoteResults = await db
    .select()
    .from(noteSubnotes)
    .where(and(eq(noteSubnotes.noteId, params.id), eq(noteSubnotes.userId, userId)))
    .orderBy(asc(noteSubnotes.created_at));

  const { content, ...noteFields } = await decryptRecord(noteResult);
  const decryptedSubnotes = await decryptRecords(subnoteResults);

  return jsonNoStore({ ...noteFields, content, subnotes: decryptedSubnotes });
});

export const PUT = withAuth<{ id: string }>(async (userId, request, { params }) => {
  const parsed = await parseBody(request, updateNoteSchema);
  if (!parsed.success) return parsed.response;

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { updated_at: now };

  if ("title" in parsed.data) updateData.title = parsed.data.title ?? null;
  if ("tags" in parsed.data) updateData.tags = parsed.data.tags ?? null;
  if ("images" in parsed.data) updateData.images = parsed.data.images ?? null;

  if (parsed.data.content !== undefined) {
    const encrypted = await encryptContentFields(parsed.data.content);
    Object.assign(updateData, encrypted);
  }

  const result = await db
    .update(notes)
    .set(updateData)
    .where(and(eq(notes.id, params.id), eq(notes.userId, userId)));

  if (result.rowsAffected === 0) return notFoundResponse();

  return jsonNoStore({ ok: true });
});

export const DELETE = withAuth<{ id: string }>(async (userId, _request, { params }) => {
  const noteRecord = await findOwned(notes, params.id, userId);
  if (!noteRecord) return notFoundResponse();

  const subnoteRecords = await db
    .select()
    .from(noteSubnotes)
    .where(and(eq(noteSubnotes.noteId, params.id), eq(noteSubnotes.userId, userId)));

  const allImageKeys = [
    ...(noteRecord.images ?? []),
    ...subnoteRecords.flatMap((s) => s.images ?? []),
  ];

  const deleteResult = await db
    .delete(notes)
    .where(and(eq(notes.id, params.id), eq(notes.userId, userId)));

  if (deleteResult.rowsAffected === 0) return notFoundResponse();

  await deleteEncryptedObjectsWithBackup(allImageKeys).catch(() => undefined);

  return deleteNoContent();
});
