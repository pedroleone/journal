import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteOwnerEntryAndImages } from "@/lib/entry-images";
import { NO_STORE_HEADERS, jsonNoStore } from "@/lib/http";
import { foodEntries } from "@/lib/schema";
import { decryptServerText } from "@/lib/server-crypto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  const result = await db
    .select()
    .from(foodEntries)
    .where(and(eq(foodEntries.id, id), eq(foodEntries.userId, userId)));

  if (result.length === 0) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const { encrypted_content, iv, ...entry } = result[0];
  const content = await decryptServerText(encrypted_content, iv);

  return jsonNoStore({ ...entry, content });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  const result = await deleteOwnerEntryAndImages(userId, "food", id);

  if (!result.ok && result.reason === "not_found") {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  if (!result.ok) {
    return jsonNoStore({ error: "Failed to delete entry images" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}
