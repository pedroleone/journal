import { and, eq, inArray } from "drizzle-orm";
import { withAuth, parseBody } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { computeStatusTimestamps } from "@/lib/library";
import { mediaItems } from "@/lib/schema";
import { bulkStatusUpdateSchema } from "@/lib/validators";

export const POST = withAuth(async (userId, request) => {
  const parsed = await parseBody(request, bulkStatusUpdateSchema);
  if (!parsed.success) return parsed.response;

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
});
