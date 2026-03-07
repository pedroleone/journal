import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { foodEntries } from "@/lib/schema";

export async function GET() {
  const result = await db
    .select({
      year: foodEntries.year,
      month: foodEntries.month,
      day: foodEntries.day,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(foodEntries)
    .groupBy(foodEntries.year, foodEntries.month, foodEntries.day)
    .orderBy(
      desc(foodEntries.year),
      desc(foodEntries.month),
      desc(foodEntries.day),
    );

  return NextResponse.json(result);
}
