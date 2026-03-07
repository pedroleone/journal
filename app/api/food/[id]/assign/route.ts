import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { foodEntries } from "@/lib/schema";
import { assignFoodEntrySchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const parsed = assignFoodEntrySchema.safeParse(body);

  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await db
    .select({ id: foodEntries.id })
    .from(foodEntries)
    .where(and(eq(foodEntries.id, id), eq(foodEntries.userId, userId)));

  if (existing.length === 0) {
    return jsonNoStore({ error: "Not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updateData: {
    year: number;
    month: number;
    day: number;
    assigned_at: string;
    updated_at: string;
    hour?: number;
    meal_slot?: "breakfast" | "lunch" | "dinner" | "snack" | null;
  } = {
    year: parsed.data.year,
    month: parsed.data.month,
    day: parsed.data.day,
    assigned_at: now,
    updated_at: now,
  };

  if ("hour" in parsed.data) {
    updateData.hour = parsed.data.hour;
  }
  if ("meal_slot" in parsed.data) {
    updateData.meal_slot = parsed.data.meal_slot;
  }

  await db
    .update(foodEntries)
    .set(updateData)
    .where(and(eq(foodEntries.id, id), eq(foodEntries.userId, userId)));

  return jsonNoStore({ ok: true });
}
