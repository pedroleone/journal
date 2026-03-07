import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { foodEntries } from "@/lib/schema";
import { assignFoodEntrySchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = assignFoodEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await db
    .select({ id: foodEntries.id })
    .from(foodEntries)
    .where(eq(foodEntries.id, id));

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  await db.update(foodEntries).set(updateData).where(eq(foodEntries.id, id));

  return NextResponse.json({ ok: true });
}
