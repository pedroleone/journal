import { desc, eq, sql } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { foodEntries } from "@/lib/schema";

export const GET = withAuth(async (userId) => {
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
});
