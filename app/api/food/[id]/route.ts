import { eq } from "drizzle-orm";
import {
  withAuth,
  parseBody,
  findOwned,
  notFoundResponse,
  deleteNoContent,
  encryptContentFields,
  decryptRecord,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { deleteOwnerEntryAndImages } from "@/lib/entry-images";
import { jsonNoStore } from "@/lib/http";
import { foodEntries } from "@/lib/schema";
import { updateFoodContentSchema } from "@/lib/validators";

export const GET = withAuth<{ id: string }>(async (userId, _request, { params }) => {
  const record = await findOwned(foodEntries, params.id, userId);
  if (!record) return notFoundResponse();

  return jsonNoStore(await decryptRecord(record));
});

export const PATCH = withAuth<{ id: string }>(async (userId, request, { params }) => {
  const parsed = await parseBody(request, updateFoodContentSchema);
  if (!parsed.success) return parsed.response;

  // Verify ownership
  const existing = await findOwned(foodEntries, params.id, userId, { id: foodEntries.id });
  if (!existing) return notFoundResponse();

  const encrypted = await encryptContentFields(parsed.data.content);

  await db
    .update(foodEntries)
    .set({
      ...encrypted,
      updated_at: new Date().toISOString(),
    })
    .where(eq(foodEntries.id, params.id));

  return jsonNoStore({ ok: true });
});

export const DELETE = withAuth<{ id: string }>(async (userId, _request, { params }) => {
  const result = await deleteOwnerEntryAndImages(userId, "food", params.id);

  if (!result.ok && result.reason === "not_found") return notFoundResponse();

  if (!result.ok) {
    return jsonNoStore({ error: "Failed to delete entry images" }, { status: 500 });
  }

  return deleteNoContent();
});
