import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { entries } from "@/lib/schema";

export async function GET() {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const [oldest] = await db
    .select({
      encrypted_content: entries.encrypted_content,
      iv: entries.iv,
    })
    .from(entries)
    .where(eq(entries.userId, userId))
    .orderBy(asc(entries.created_at))
    .limit(1);

  return NextResponse.json({ entry: oldest ?? null });
}
