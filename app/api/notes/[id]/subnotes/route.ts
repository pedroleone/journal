import { nanoid } from "nanoid";
import {
  withAuth,
  parseBody,
  findOwned,
  notFoundResponse,
  encryptContentFields,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { notes, noteSubnotes } from "@/lib/schema";
import { createSubnoteSchema } from "@/lib/validators";

export const POST = withAuth<{ id: string }>(async (userId, request, { params }) => {
  const noteRecord = await findOwned(notes, params.id, userId, { id: notes.id });
  if (!noteRecord) return notFoundResponse();

  const parsed = await parseBody(request, createSubnoteSchema);
  if (!parsed.success) return parsed.response;

  const now = new Date().toISOString();
  const id = nanoid();
  const encrypted = await encryptContentFields(parsed.data.content);

  await db.insert(noteSubnotes).values({
    id,
    noteId: params.id,
    userId,
    images: parsed.data.images ?? null,
    ...encrypted,
    created_at: now,
    updated_at: now,
  });

  return jsonNoStore({ id }, { status: 201 });
});
