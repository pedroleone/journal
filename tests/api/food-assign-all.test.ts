import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;

describe("POST /api/food/assign-all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
  });

  it("assigns all uncategorized entries", async () => {
    mockDb.where
      .mockResolvedValueOnce([
        { id: "f1", logged_at: "2026-03-06T10:30:00.000Z", hour: 10 },
        { id: "f2", logged_at: "2026-03-06T18:30:00.000Z", hour: null },
      ])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const { POST } = await import("@/app/api/food/assign-all/route");
    const res = await POST();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.updated).toBe(2);
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });
});
