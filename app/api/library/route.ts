import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  withAuth,
  parseBody,
  parseQuery,
  storeOptionalEncryptedContent,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { mediaItems } from "@/lib/schema";
import { computeStatusTimestamps } from "@/lib/library";
import { createMediaItemSchema, mediaItemListQuerySchema } from "@/lib/validators";

export const GET = withAuth(async (userId, request: NextRequest) => {
  const parsed = parseQuery(request, mediaItemListQuerySchema, [
    "type", "status", "genre", "reaction", "platform", "rating", "search",
  ]);
  if (!parsed.success) return parsed.response;

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
    conditions.push(sql`${mediaItems.status} IN ('finished', 'dropped')`);
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
});

export const POST = withAuth(async (userId, request) => {
  const parsed = await parseBody(request, createMediaItemSchema);
  if (!parsed.success) return parsed.response;

  const now = new Date().toISOString();
  const id = nanoid();

  const encryptedContent = await storeOptionalEncryptedContent(parsed.data.content);

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
    ...encryptedContent,
    added_at: now,
    started_at: null,
    finished_at: null,
    ...computeStatusTimestamps(parsed.data.status, { started_at: null, finished_at: null }, now),
    created_at: now,
    updated_at: now,
  });

  return jsonNoStore({ id }, { status: 201 });
});
