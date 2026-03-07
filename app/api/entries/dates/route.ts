import { eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { entries } from "@/lib/schema";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

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
}
