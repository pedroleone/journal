import { and, eq, isNull } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { foodEntries } from "@/lib/schema";
import { suggestMealSlot } from "@/lib/food";

export async function POST() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const pending = await db
    .select({
      id: foodEntries.id,
      logged_at: foodEntries.logged_at,
      hour: foodEntries.hour,
    })
    .from(foodEntries)
    .where(and(isNull(foodEntries.assigned_at), eq(foodEntries.userId, userId)));

  const nowIso = new Date().toISOString();

  for (const entry of pending) {
    const loggedDate = new Date(entry.logged_at);
    const hour = entry.hour ?? loggedDate.getHours();

    await db
      .update(foodEntries)
      .set({
        year: loggedDate.getFullYear(),
        month: loggedDate.getMonth() + 1,
        day: loggedDate.getDate(),
        hour,
        meal_slot: suggestMealSlot(hour),
        assigned_at: nowIso,
        updated_at: nowIso,
      })
      .where(and(eq(foodEntries.id, entry.id), eq(foodEntries.userId, userId)));
  }

  return jsonNoStore({ updated: pending.length });
}
