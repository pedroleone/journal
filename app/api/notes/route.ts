import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { and, desc, eq, sql } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { notes } from "@/lib/schema";
import { encryptServerText } from "@/lib/server-crypto";
import { createNoteSchema, noteTagQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const parsed = noteTagQuerySchema.safeParse({ tag: searchParams.get("tag") ?? undefined });
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid query" }, { status: 400 });
  }

  const conditions = [eq(notes.userId, userId)];
  if (parsed.data.tag) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM json_each(${notes.tags}) WHERE value = ${parsed.data.tag})`,
    );
  }

  const result = await db
    .select({
      id: notes.id,
      title: notes.title,
      tags: notes.tags,
      images: notes.images,
      created_at: notes.created_at,
      updated_at: notes.updated_at,
    })
    .from(notes)
    .where(and(...conditions))
    .orderBy(desc(notes.updated_at));

  return jsonNoStore(result);
}

export async function POST(request: NextRequest) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = nanoid();
  const encrypted = await encryptServerText(parsed.data.content);

  await db.insert(notes).values({
    id,
    userId,
    title: parsed.data.title ?? null,
    tags: parsed.data.tags ?? null,
    images: parsed.data.images ?? null,
    encrypted_content: encrypted.ciphertext,
    iv: encrypted.iv,
    created_at: now,
    updated_at: now,
  });

  return jsonNoStore({ id }, { status: 201 });
}
