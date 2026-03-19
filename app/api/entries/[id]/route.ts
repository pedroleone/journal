import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
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
import { entries } from "@/lib/schema";
import { updateEntrySchema } from "@/lib/validators";

export const GET = withAuth<{ id: string }>(async (userId, _request, { params }) => {
  const record = await findOwned(entries, params.id, userId);
  if (!record) return notFoundResponse();

  return jsonNoStore(await decryptRecord(record));
});

export const PUT = withAuth<{ id: string }>(async (userId, request, { params }) => {
  const parsed = await parseBody(request, updateEntrySchema);
  if (!parsed.success) return parsed.response;

  const now = new Date().toISOString();
  const encrypted = await encryptContentFields(parsed.data.content);
  const updateData: {
    encrypted_content: string;
    iv: string;
    updated_at: string;
    images?: string[] | null;
  } = {
    ...encrypted,
    updated_at: now,
  };

  if ("images" in parsed.data) {
    updateData.images = parsed.data.images ?? null;
  }

  const result = await db
    .update(entries)
    .set(updateData)
    .where(and(eq(entries.id, params.id), eq(entries.userId, userId)));

  if (result.rowsAffected === 0) return notFoundResponse();

  return jsonNoStore({ ok: true });
});

export const DELETE = withAuth<{ id: string }>(async (userId, _request, { params }) => {
  const result = await deleteOwnerEntryAndImages(userId, "journal", params.id);

  if (!result.ok && result.reason === "not_found") return notFoundResponse();

  if (!result.ok) {
    return jsonNoStore({ error: "Failed to delete entry images" }, { status: 500 });
  }

  return deleteNoContent();
});
