import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { entries } from "@/lib/schema";
import { createEntrySchema, browseQuerySchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const body = await request.json();
  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = nanoid();

  await db.insert(entries).values({
    id,
    userId,
    source: "web",
    year: parsed.data.year,
    month: parsed.data.month,
    day: parsed.data.day,
    hour: parsed.data.hour ?? null,
    encrypted_content: parsed.data.encrypted_content,
    iv: parsed.data.iv,
    images: null,
    tags: null,
    created_at: now,
    updated_at: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const parsed = browseQuerySchema.safeParse({
    year: searchParams.get("year") ?? undefined,
    month: searchParams.get("month") ?? undefined,
    day: searchParams.get("day") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const conditions = [eq(entries.userId, userId)];
  if (parsed.data.year !== undefined) conditions.push(eq(entries.year, parsed.data.year));
  if (parsed.data.month !== undefined) conditions.push(eq(entries.month, parsed.data.month));
  if (parsed.data.day !== undefined) conditions.push(eq(entries.day, parsed.data.day));

  const result = await db
    .select()
    .from(entries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(entries.year, entries.month, entries.day);

  // Reverse for desc order
  result.reverse();

  return NextResponse.json(result);
}
