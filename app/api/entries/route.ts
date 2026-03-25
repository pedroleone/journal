import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import {
  withAuth,
  parseBody,
  parseQuery,
  readEncryptedContentList,
  storeEncryptedContent,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { entries } from "@/lib/schema";
import { createEntrySchema, browseQuerySchema } from "@/lib/validators";

export const POST = withAuth(async (userId, request) => {
  const parsed = await parseBody(request, createEntrySchema);
  if (!parsed.success) return parsed.response;

  const existing = await db
    .select({ id: entries.id })
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        eq(entries.year, parsed.data.year),
        eq(entries.month, parsed.data.month),
        eq(entries.day, parsed.data.day),
      ),
    );

  if (existing.length > 0) {
    return jsonNoStore(
      {
        error: "A journal entry already exists for this date",
        id: existing[0].id,
      },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const id = nanoid();
  const encrypted = await storeEncryptedContent(parsed.data.content);

  await db.insert(entries).values({
    id,
    userId,
    source: "web",
    year: parsed.data.year,
    month: parsed.data.month,
    day: parsed.data.day,
    hour: parsed.data.hour ?? null,
    ...encrypted,
    images: parsed.data.images ?? null,
    tags: null,
    created_at: now,
    updated_at: now,
  });

  return jsonNoStore({ id }, { status: 201 });
});

export const GET = withAuth(async (userId, request: NextRequest) => {
  const parsed = parseQuery(request, browseQuerySchema, ["year", "month", "day"]);
  if (!parsed.success) return parsed.response;

  const conditions = [eq(entries.userId, userId)];
  if (parsed.data.year !== undefined) conditions.push(eq(entries.year, parsed.data.year));
  if (parsed.data.month !== undefined) conditions.push(eq(entries.month, parsed.data.month));
  if (parsed.data.day !== undefined) conditions.push(eq(entries.day, parsed.data.day));

  const result = await db
    .select()
    .from(entries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(entries.year, entries.month, entries.day);

  result.reverse();

  return jsonNoStore(await readEncryptedContentList(result));
});
