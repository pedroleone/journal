import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { and, desc, eq, sql } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { mediaItems } from "@/lib/schema";
import { encryptServerText } from "@/lib/server-crypto";
import { computeStatusTimestamps } from "@/lib/library";
import { createMediaItemSchema, mediaItemListQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const parsed = mediaItemListQuerySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    genre: searchParams.get("genre") ?? undefined,
    reaction: searchParams.get("reaction") ?? undefined,
    platform: searchParams.get("platform") ?? undefined,
    rating: searchParams.get("rating") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid query" }, { status: 400 });
  }

  const conditions = [eq(mediaItems.userId, userId)];
  if (parsed.data.type) {
    conditions.push(eq(mediaItems.type, parsed.data.type));
  }
  if (parsed.data.status) {
    conditions.push(eq(mediaItems.status, parsed.data.status));
  }
  if (parsed.data.genre) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM json_each(${mediaItems.genres}) WHERE value = ${parsed.data.genre})`,
    );
  }
  if (parsed.data.reaction) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM json_each(${mediaItems.reactions}) WHERE value = ${parsed.data.reaction})`,
    );
  }
  if (parsed.data.platform) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM json_each(json_extract(${mediaItems.metadata}, '$.platform')) WHERE value = ${parsed.data.platform})`,
    );
  }
  if (parsed.data.rating) {
    conditions.push(sql`${mediaItems.rating} >= ${parsed.data.rating}`);
  }
  if (parsed.data.search) {
    const pattern = `%${parsed.data.search}%`;
    conditions.push(
      sql`(${mediaItems.title} LIKE ${pattern} OR ${mediaItems.creator} LIKE ${pattern})`,
    );
  }

  const result = await db
    .select({
      id: mediaItems.id,
      type: mediaItems.type,
      title: mediaItems.title,
      creator: mediaItems.creator,
      url: mediaItems.url,
      status: mediaItems.status,
      rating: mediaItems.rating,
      reactions: mediaItems.reactions,
      genres: mediaItems.genres,
      metadata: mediaItems.metadata,
      cover_image: mediaItems.cover_image,
      added_at: mediaItems.added_at,
      started_at: mediaItems.started_at,
      finished_at: mediaItems.finished_at,
      created_at: mediaItems.created_at,
      updated_at: mediaItems.updated_at,
    })
    .from(mediaItems)
    .where(and(...conditions))
    .orderBy(desc(mediaItems.updated_at));

  return jsonNoStore(result);
}

export async function POST(request: NextRequest) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const body = await request.json();
  const parsed = createMediaItemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = nanoid();

  let encrypted_content: string | null = null;
  let iv: string | null = null;
  if (parsed.data.content) {
    const encrypted = await encryptServerText(parsed.data.content);
    encrypted_content = encrypted.ciphertext;
    iv = encrypted.iv;
  }

  await db.insert(mediaItems).values({
    id,
    userId,
    type: parsed.data.type,
    title: parsed.data.title,
    creator: parsed.data.creator ?? null,
    url: parsed.data.url ?? null,
    status: parsed.data.status,
    rating: parsed.data.rating ?? null,
    reactions: parsed.data.reactions ?? null,
    genres: parsed.data.genres ?? null,
    metadata: parsed.data.metadata ?? null,
    cover_image: null,
    encrypted_content,
    iv,
    added_at: now,
    started_at: null,
    finished_at: null,
    ...computeStatusTimestamps(parsed.data.status, { started_at: null, finished_at: null }, now),
    created_at: now,
    updated_at: now,
  });

  return jsonNoStore({ id }, { status: 201 });
}
