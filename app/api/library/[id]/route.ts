import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { mediaItems, mediaItemNotes } from "@/lib/schema";
import { decryptServerText, encryptServerText } from "@/lib/server-crypto";
import { computeStatusTimestamps } from "@/lib/library";
import { updateMediaItemSchema } from "@/lib/validators";
import { deleteEncryptedObjectsWithBackup } from "@/lib/entry-images";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;

  const [item] = await db
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));

  if (!item) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const noteResults = await db
    .select()
    .from(mediaItemNotes)
    .where(and(eq(mediaItemNotes.mediaItemId, id), eq(mediaItemNotes.userId, userId)))
    .orderBy(asc(mediaItemNotes.created_at));

  const { encrypted_content, iv, ...fields } = item;
  const content = encrypted_content && iv
    ? await decryptServerText(encrypted_content, iv)
    : null;

  const decryptedNotes = await Promise.all(
    noteResults.map(async ({ encrypted_content: nc, iv: niv, ...note }) => ({
      ...note,
      content: await decryptServerText(nc, niv),
    })),
  );

  return jsonNoStore({ ...fields, content, notes: decryptedNotes });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const parsed = updateMediaItemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { updated_at: now };

  // Auto-timestamps: compute before explicit values so user-provided timestamps override
  if ("status" in parsed.data && parsed.data.status) {
    const [current] = await db
      .select({ started_at: mediaItems.started_at, finished_at: mediaItems.finished_at })
      .from(mediaItems)
      .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));
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
    const encrypted = await encryptServerText(parsed.data.content);
    updateData.encrypted_content = encrypted.ciphertext;
    updateData.iv = encrypted.iv;
  }

  const result = await db
    .update(mediaItems)
    .set(updateData)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));

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

  const [itemRecord] = await db
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));

  if (!itemRecord) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const noteRecords = await db
    .select()
    .from(mediaItemNotes)
    .where(and(eq(mediaItemNotes.mediaItemId, id), eq(mediaItemNotes.userId, userId)));

  const allImageKeys = [
    ...(itemRecord.cover_image ? [itemRecord.cover_image] : []),
    ...noteRecords.flatMap((n) => n.images ?? []),
  ];

  const deleteResult = await db
    .delete(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));

  if (deleteResult.rowsAffected === 0) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  await deleteEncryptedObjectsWithBackup(allImageKeys).catch(() => undefined);

  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}
