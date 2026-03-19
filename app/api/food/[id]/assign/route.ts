import { and, eq } from "drizzle-orm";
import {
  withAuth,
  parseBody,
  findOwned,
  notFoundResponse,
} from "@/lib/api-helpers";
import { db } from "@/lib/db";
import type { MealSlot } from "@/lib/food";
import { jsonNoStore } from "@/lib/http";
import { foodEntries } from "@/lib/schema";
import { assignFoodEntrySchema } from "@/lib/validators";

export const PATCH = withAuth<{ id: string }>(async (userId, request, { params }) => {
  const parsed = await parseBody(request, assignFoodEntrySchema);
  if (!parsed.success) return parsed.response;

  const existing = await findOwned(foodEntries, params.id, userId, { id: foodEntries.id });
  if (!existing) return notFoundResponse();

  const now = new Date().toISOString();
  const updateData: {
    year: number;
    month: number;
    day: number;
    assigned_at: string;
    updated_at: string;
    hour?: number;
    meal_slot?: MealSlot | null;
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
    .where(and(eq(foodEntries.id, params.id), eq(foodEntries.userId, userId)));

  return jsonNoStore({ ok: true });
});
