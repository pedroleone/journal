import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { mediaItemNotes } from "@/lib/schema";
import { encryptServerText } from "@/lib/server-crypto";
import { updateMediaItemNoteSchema } from "@/lib/validators";
import { deleteEncryptedObjectsWithBackup } from "@/lib/entry-images";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { noteId } = await params;
  const body = await request.json();
  const parsed = updateMediaItemNoteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { updated_at: now };

  if ("images" in parsed.data) updateData.images = parsed.data.images ?? null;

  if (parsed.data.content !== undefined) {
    const encrypted = await encryptServerText(parsed.data.content);
    updateData.encrypted_content = encrypted.ciphertext;
    updateData.iv = encrypted.iv;
  }

  const result = await db
    .update(mediaItemNotes)
    .set(updateData)
    .where(and(eq(mediaItemNotes.id, noteId), eq(mediaItemNotes.userId, userId)));

  if (result.rowsAffected === 0) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  return jsonNoStore({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { noteId } = await params;

  const [note] = await db
    .select()
    .from(mediaItemNotes)
    .where(and(eq(mediaItemNotes.id, noteId), eq(mediaItemNotes.userId, userId)));

  if (!note) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const deleteResult = await db
    .delete(mediaItemNotes)
    .where(and(eq(mediaItemNotes.id, noteId), eq(mediaItemNotes.userId, userId)));

  if (deleteResult.rowsAffected === 0) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  await deleteEncryptedObjectsWithBackup(note.images ?? []).catch(() => undefined);

  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}
