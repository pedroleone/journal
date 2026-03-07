import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { notes, noteSubnotes } from "@/lib/schema";
import { decryptServerText, encryptServerText } from "@/lib/server-crypto";
import { updateNoteSchema } from "@/lib/validators";
import { deleteEncryptedObjectsWithBackup } from "@/lib/entry-images";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;

  const [noteResult] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));

  if (!noteResult) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const subnoteResults = await db
    .select()
    .from(noteSubnotes)
    .where(and(eq(noteSubnotes.noteId, id), eq(noteSubnotes.userId, userId)))
    .orderBy(asc(noteSubnotes.created_at));

  const { encrypted_content, iv, ...noteFields } = noteResult;
  const content = await decryptServerText(encrypted_content, iv);

  const decryptedSubnotes = await Promise.all(
    subnoteResults.map(async ({ encrypted_content: sc, iv: siv, ...subnote }) => ({
      ...subnote,
      content: await decryptServerText(sc, siv),
    })),
  );

  return jsonNoStore({ ...noteFields, content, subnotes: decryptedSubnotes });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { updated_at: now };

  if ("title" in parsed.data) updateData.title = parsed.data.title ?? null;
  if ("tags" in parsed.data) updateData.tags = parsed.data.tags ?? null;
  if ("images" in parsed.data) updateData.images = parsed.data.images ?? null;

  if (parsed.data.content !== undefined) {
    const encrypted = await encryptServerText(parsed.data.content);
    updateData.encrypted_content = encrypted.ciphertext;
    updateData.iv = encrypted.iv;
  }

  const result = await db
    .update(notes)
    .set(updateData)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));

  if (result.rowsAffected === 0) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  return jsonNoStore({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;

  const [noteRecord] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));

  if (!noteRecord) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const subnoteRecords = await db
    .select()
    .from(noteSubnotes)
    .where(and(eq(noteSubnotes.noteId, id), eq(noteSubnotes.userId, userId)));

  // Collect all image keys to delete from R2
  const allImageKeys = [
    ...(noteRecord.images ?? []),
    ...subnoteRecords.flatMap((s) => s.images ?? []),
  ];

  // Delete the note (cascades subnotes in DB)
  const deleteResult = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));

  if (deleteResult.rowsAffected === 0) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  // Best-effort image cleanup
  await deleteEncryptedObjectsWithBackup(allImageKeys).catch(() => undefined);

  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}
