import { and, eq } from "drizzle-orm";
import {
  withAuth,
  parseBody,
  findOwned,
  notFoundResponse,
  deleteNoContent,
  encryptContentFields,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { noteSubnotes } from "@/lib/schema";
import { updateSubnoteSchema } from "@/lib/validators";
import { deleteEncryptedObjectsWithBackup } from "@/lib/entry-images";

export const PUT = withAuth<{ id: string; subnoteId: string }>(async (userId, request, { params }) => {
  const parsed = await parseBody(request, updateSubnoteSchema);
  if (!parsed.success) return parsed.response;

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { updated_at: now };

  if ("images" in parsed.data) updateData.images = parsed.data.images ?? null;

  if (parsed.data.content !== undefined) {
    const encrypted = await encryptContentFields(parsed.data.content);
    Object.assign(updateData, encrypted);
  }

  const result = await db
    .update(noteSubnotes)
    .set(updateData)
    .where(and(eq(noteSubnotes.id, params.subnoteId), eq(noteSubnotes.userId, userId)));

  if (result.rowsAffected === 0) return notFoundResponse();

  return jsonNoStore({ ok: true });
});

export const DELETE = withAuth<{ id: string; subnoteId: string }>(async (userId, _request, { params }) => {
  const subnote = await findOwned(noteSubnotes, params.subnoteId, userId);
  if (!subnote) return notFoundResponse();

  const deleteResult = await db
    .delete(noteSubnotes)
    .where(and(eq(noteSubnotes.id, params.subnoteId), eq(noteSubnotes.userId, userId)));

  if (deleteResult.rowsAffected === 0) return notFoundResponse();

  await deleteEncryptedObjectsWithBackup(subnote.images ?? []).catch(() => undefined);

  return deleteNoContent();
});
