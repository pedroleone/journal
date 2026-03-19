import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { entries } from "@/lib/schema";

export const GET = withAuth(async (userId) => {
  const result = await db
    .select({
      id: entries.id,
      year: entries.year,
      month: entries.month,
      day: entries.day,
    })
    .from(entries)
    .where(eq(entries.userId, userId))
    .orderBy(entries.year, entries.month, entries.day);

  result.reverse();

  return jsonNoStore(result);
});
