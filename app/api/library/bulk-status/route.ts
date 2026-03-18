import { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getRequiredUserId, unauthorizedResponse } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { computeStatusTimestamps } from "@/lib/library";
import { mediaItems } from "@/lib/schema";
import { bulkStatusUpdateSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const userId = await getRequiredUserId();
  if (!userId) return unauthorizedResponse();

  const body = await request.json();
  const parsed = bulkStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const { ids, status } = parsed.data;
  const now = new Date().toISOString();

  // Fetch current timestamps for all targeted items
  const items = await db
    .select({
      id: mediaItems.id,
      started_at: mediaItems.started_at,
      finished_at: mediaItems.finished_at,
    })
    .from(mediaItems)
    .where(and(eq(mediaItems.userId, userId), inArray(mediaItems.id, ids)));

  let updated = 0;

  for (const item of items) {
    const autoTs = computeStatusTimestamps(
      status,
      { started_at: item.started_at, finished_at: item.finished_at },
      now,
    );

    await db
      .update(mediaItems)
      .set({
        status,
        updated_at: now,
        ...autoTs,
      })
      .where(and(eq(mediaItems.id, item.id), eq(mediaItems.userId, userId)));

    updated++;
  }

  return jsonNoStore({ updated });
}
