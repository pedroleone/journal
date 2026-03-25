import { nanoid } from "nanoid";
import {
  withAuth,
  parseBody,
  findOwned,
  notFoundResponse,
  storeEncryptedContent,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { mediaItems, mediaItemNotes } from "@/lib/schema";
import { createMediaItemNoteSchema } from "@/lib/validators";

export const POST = withAuth<{ id: string }>(async (userId, request, { params }) => {
  const itemRecord = await findOwned(mediaItems, params.id, userId, { id: mediaItems.id });
  if (!itemRecord) return notFoundResponse();

  const parsed = await parseBody(request, createMediaItemNoteSchema);
  if (!parsed.success) return parsed.response;

  const now = new Date().toISOString();
  const id = nanoid();
  const encrypted = await storeEncryptedContent(parsed.data.content);

  await db.insert(mediaItemNotes).values({
    id,
    mediaItemId: params.id,
    userId,
    images: parsed.data.images ?? null,
    ...encrypted,
    created_at: now,
    updated_at: now,
  });

  return jsonNoStore({ id }, { status: 201 });
});
