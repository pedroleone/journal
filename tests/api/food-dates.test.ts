import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;

describe("GET /api/food/dates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns grouped date counts", async () => {
    const rows = [
      { year: 2026, month: 3, day: 6, count: 3 },
      { year: 2026, month: 3, day: 5, count: 0 },
    ];

    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.groupBy.mockReturnThis();
    mockDb.orderBy.mockResolvedValue(rows);

    const { GET } = await import("@/app/api/food/dates/route");
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(rows);
  });
});
