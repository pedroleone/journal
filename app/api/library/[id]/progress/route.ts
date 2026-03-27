import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";
import { withAuth, notFoundResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { jsonNoStore } from "@/lib/http";
import { normalizeBookMetadata } from "@/lib/library";
import { mediaItems, mediaItemProgressUpdates } from "@/lib/schema";
import { getBookProgressPayloadSchema } from "@/lib/validators";

export const POST = withAuth<{ id: string }>(async (userId, request, { params }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: "Invalid input" }, { status: 400 });
  }

  const result = await db.transaction(async (tx) => {
    const [item] = await tx
      .select({
        id: mediaItems.id,
        type: mediaItems.type,
        status: mediaItems.status,
        metadata: mediaItems.metadata,
      })
      .from(mediaItems)
      .where(and(eq(mediaItems.id, params.id), eq(mediaItems.userId, userId)));
    if (!item) return { kind: "not_found" } as const;

    if (item.type !== "book") {
      return {
        kind: "invalid",
        response: jsonNoStore({ error: "Progress logging is only supported for books" }, { status: 400 }),
      } as const;
    }

    if (item.status === "finished") {
      return {
        kind: "invalid",
        response: jsonNoStore({ error: "Cannot log progress for finished items" }, { status: 400 }),
      } as const;
    }

    const metadata = normalizeBookMetadata(item.metadata);
    const payloadSchema = getBookProgressPayloadSchema(metadata.bookFormat);
    if (!payloadSchema) {
      return {
        kind: "invalid",
        response: jsonNoStore({ error: "Book format must be set before logging progress" }, { status: 400 }),
      } as const;
    }

    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return {
        kind: "invalid",
        response: jsonNoStore(
          { error: "Invalid input", details: parsed.error.issues },
          { status: 400 },
        ),
      } as const;
    }

    if (
      metadata.bookFormat === "physical"
      && metadata.totalPages !== null
      && parsed.data.currentPage > metadata.totalPages
    ) {
      return {
        kind: "invalid",
        response: jsonNoStore(
          {
            error: "Invalid input",
            details: [{
              code: "custom",
              message: "Current page cannot exceed totalPages",
              path: ["currentPage"],
            }],
          },
          { status: 400 },
        ),
      } as const;
    }

    const now = new Date().toISOString();
    const nextMetadata = normalizeBookMetadata(
      metadata.bookFormat === "ebook"
        ? {
          ...metadata,
          currentProgressPercent: parsed.data.progressPercent,
          progressUpdatedAt: now,
        }
        : {
          ...metadata,
          currentProgressPage: parsed.data.currentPage,
          progressUpdatedAt: now,
        },
    );

    await tx.insert(mediaItemProgressUpdates).values({
      id: nanoid(),
      mediaItemId: params.id,
      userId,
      progress_kind: metadata.bookFormat === "ebook" ? "percent" : "page",
      progress_value: metadata.bookFormat === "ebook"
        ? parsed.data.progressPercent
        : parsed.data.currentPage,
      max_value: metadata.bookFormat === "physical" ? metadata.totalPages : null,
      created_at: now,
    });

    const updateResult = await tx
      .update(mediaItems)
      .set({
        metadata: nextMetadata,
        updated_at: now,
      })
      .where(and(eq(mediaItems.id, params.id), eq(mediaItems.userId, userId)));

    return { kind: "updated", updateResult } as const;
  });

  if (result.kind === "not_found") return notFoundResponse();
  if (result.kind === "invalid") return result.response;
  if (result.updateResult.rowsAffected === 0) return notFoundResponse();

  return jsonNoStore({ ok: true });
});
