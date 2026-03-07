import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { entries } from "@/lib/schema";
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

  return jsonNoStore(result[0]);
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
  const result = await db
    .update(entries)
    .set({
      encrypted_content: parsed.data.encrypted_content,
      iv: parsed.data.iv,
      updated_at: now,
    })
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
  const result = await db
    .delete(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, userId)));

  if (result.rowsAffected === 0) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}
