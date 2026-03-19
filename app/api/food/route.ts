import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  withAuth,
  parseBody,
  parseQuery,
  encryptContentFields,
  decryptRecords,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { foodEntries } from "@/lib/schema";
import { createFoodEntrySchema, foodListQuerySchema } from "@/lib/validators";

export const POST = withAuth(async (userId, request) => {
  const parsed = await parseBody(request, createFoodEntrySchema);
  if (!parsed.success) return parsed.response;

  const id = nanoid();
  const now = new Date();
  const nowIso = now.toISOString();
  const encrypted = await encryptContentFields(parsed.data.content);

  // When meal_slot + date are provided, create an already-assigned entry
  const hasSlotInfo = parsed.data.meal_slot && parsed.data.year && parsed.data.month && parsed.data.day;

  await db.insert(foodEntries).values({
    id,
    userId,
    source: "web",
    year: parsed.data.year ?? now.getFullYear(),
    month: parsed.data.month ?? (now.getMonth() + 1),
    day: parsed.data.day ?? now.getDate(),
    hour: now.getHours(),
    meal_slot: parsed.data.meal_slot ?? null,
    assigned_at: hasSlotInfo ? nowIso : null,
    logged_at: nowIso,
    ...encrypted,
    images: parsed.data.images ?? null,
    tags: parsed.data.tags ?? null,
    created_at: nowIso,
    updated_at: nowIso,
  });

  return jsonNoStore({ id }, { status: 201 });
});

export const GET = withAuth(async (userId, request: NextRequest) => {
  const parsed = parseQuery(request, foodListQuerySchema, [
    "uncategorized", "year", "month", "day", "meal_slot", "limit",
  ]);
  if (!parsed.success) return parsed.response;

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

  return jsonNoStore(await decryptRecords(result));
});
