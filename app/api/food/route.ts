import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { foodEntries } from "@/lib/schema";
import { createFoodEntrySchema, foodListQuerySchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const body = await request.json();
  const parsed = createFoodEntrySchema.safeParse(body);

  if (!parsed.success) {
    return jsonNoStore(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const id = nanoid();
  const now = new Date();
  const nowIso = now.toISOString();

  await db.insert(foodEntries).values({
    id,
    userId,
    source: "web",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    meal_slot: null,
    assigned_at: null,
    logged_at: nowIso,
    encrypted_content: parsed.data.encrypted_content,
    iv: parsed.data.iv,
    images: null,
    tags: null,
    created_at: nowIso,
    updated_at: nowIso,
  });

  return jsonNoStore({ id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const parsed = foodListQuerySchema.safeParse({
    uncategorized: searchParams.get("uncategorized") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    month: searchParams.get("month") ?? undefined,
    day: searchParams.get("day") ?? undefined,
    meal_slot: searchParams.get("meal_slot") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid query" }, { status: 400 });
  }

  const conditions = [eq(foodEntries.userId, userId)];
  if (parsed.data.uncategorized === true) {
    conditions.push(isNull(foodEntries.assigned_at));
  }
  if (parsed.data.year !== undefined) {
    conditions.push(eq(foodEntries.year, parsed.data.year));
  }
  if (parsed.data.month !== undefined) {
    conditions.push(eq(foodEntries.month, parsed.data.month));
  }
  if (parsed.data.day !== undefined) {
    conditions.push(eq(foodEntries.day, parsed.data.day));
  }
  if (parsed.data.meal_slot !== undefined) {
    conditions.push(eq(foodEntries.meal_slot, parsed.data.meal_slot));
  }

  const baseQuery = db
    .select()
    .from(foodEntries)
    .where(and(...conditions))
    .orderBy(desc(foodEntries.logged_at));

  const result =
    parsed.data.limit !== undefined
      ? await baseQuery.limit(parsed.data.limit)
      : await baseQuery;

  return jsonNoStore(result);
}
