import { NextResponse } from "next/server";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { foodEntries } from "@/lib/schema";
import { suggestMealSlot } from "@/lib/food";

export async function POST() {
  const pending = await db
    .select({
      id: foodEntries.id,
      logged_at: foodEntries.logged_at,
      hour: foodEntries.hour,
    })
    .from(foodEntries)
    .where(isNull(foodEntries.assigned_at));

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
      .where(eq(foodEntries.id, entry.id));
  }

  return NextResponse.json({ updated: pending.length });
}
