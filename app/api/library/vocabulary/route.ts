import { NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { withAuth, parseQuery } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { mediaItems } from "@/lib/schema";
import { vocabularyQuerySchema } from "@/lib/validators";
import { DEFAULT_REACTIONS } from "@/lib/library";

export const GET = withAuth(async (userId, request: NextRequest) => {
  const parsed = parseQuery(request, vocabularyQuerySchema, ["field", "type"]);
  if (!parsed.success) return parsed.response;

  const { field, type } = parsed.data;

  let results: { value: string; count: number }[];

  if (field === "reactions") {
    results = await db.all<{ value: string; count: number }>(
      sql`SELECT je.value as value, COUNT(*) as count
          FROM ${mediaItems}, json_each(${mediaItems.reactions}) je
          WHERE ${mediaItems.userId} = ${userId}
          GROUP BY je.value
          ORDER BY count DESC`,
    );
    if (results.length === 0) {
      results = DEFAULT_REACTIONS.map((r) => ({ value: r, count: 0 }));
    }
  } else if (field === "genres") {
    results = await db.all<{ value: string; count: number }>(
      sql`SELECT je.value as value, COUNT(*) as count
          FROM ${mediaItems}, json_each(${mediaItems.genres}) je
          WHERE ${mediaItems.userId} = ${userId}
            ${type ? sql`AND ${mediaItems.type} = ${type}` : sql``}
          GROUP BY je.value
          ORDER BY count DESC`,
    );
  } else {
    // platform — extracted from metadata JSON for game type
    results = await db.all<{ value: string; count: number }>(
      sql`SELECT je.value as value, COUNT(*) as count
          FROM ${mediaItems}, json_each(json_extract(${mediaItems.metadata}, '$.platform')) je
          WHERE ${mediaItems.userId} = ${userId} AND ${mediaItems.type} = 'game'
          GROUP BY je.value
          ORDER BY count DESC`,
    );
  }

  return jsonNoStore(results);
});
