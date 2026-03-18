import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { mediaItems, mediaItemNotes } from "@/lib/schema";
import { encryptServerText } from "@/lib/server-crypto";
import { createMediaItemNoteSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id: mediaItemId } = await params;

  const [itemRecord] = await db
    .select({ id: mediaItems.id })
    .from(mediaItems)
    .where(and(eq(mediaItems.id, mediaItemId), eq(mediaItems.userId, userId)));

  if (!itemRecord) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createMediaItemNoteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = nanoid();
  const encrypted = await encryptServerText(parsed.data.content);

  await db.insert(mediaItemNotes).values({
    id,
    mediaItemId,
    userId,
    images: parsed.data.images ?? null,
    encrypted_content: encrypted.ciphertext,
    iv: encrypted.iv,
    created_at: now,
    updated_at: now,
  });

  return jsonNoStore({ id }, { status: 201 });
}
