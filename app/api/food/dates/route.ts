import { desc, eq, sql } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { foodEntries } from "@/lib/schema";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const result = await db
    .select({
      year: foodEntries.year,
      month: foodEntries.month,
      day: foodEntries.day,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(foodEntries)
    .where(eq(foodEntries.userId, userId))
    .groupBy(foodEntries.year, foodEntries.month, foodEntries.day)
    .orderBy(
      desc(foodEntries.year),
      desc(foodEntries.month),
      desc(foodEntries.day),
    );

  return jsonNoStore(result);
}
