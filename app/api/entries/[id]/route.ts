import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteOwnerEntryAndImages } from "@/lib/entry-images";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { entries } from "@/lib/schema";
import { decryptServerText, encryptServerText } from "@/lib/server-crypto";
import { updateEntrySchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  const result = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, userId)));

  if (result.length === 0) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const { encrypted_content, iv, ...entry } = result[0];
  const content = await decryptServerText(encrypted_content, iv);

  return jsonNoStore({ ...entry, content });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const parsed = updateEntrySchema.safeParse(body);

  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid input" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const encrypted = await encryptServerText(parsed.data.content);
  const updateData: {
    encrypted_content: string;
    iv: string;
    updated_at: string;
    images?: string[] | null;
  } = {
    encrypted_content: encrypted.ciphertext,
    iv: encrypted.iv,
    updated_at: now,
  };

  if ("images" in parsed.data) {
    updateData.images = parsed.data.images ?? null;
  }

  const result = await db
    .update(entries)
    .set(updateData)
    .where(and(eq(entries.id, id), eq(entries.userId, userId)));

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
  const result = await deleteOwnerEntryAndImages(userId, "journal", id);

  if (!result.ok && result.reason === "not_found") {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  if (!result.ok) {
    return jsonNoStore({ error: "Failed to delete entry images" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}
