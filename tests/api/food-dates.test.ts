import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("GET /api/food/dates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/food/dates/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns grouped date counts", async () => {
    const rows = [
      { year: 2026, month: 3, day: 6, count: 3 },
      { year: 2026, month: 3, day: 5, count: 0 },
    ];

    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.groupBy.mockReturnThis();
    mockDb.orderBy.mockResolvedValue(rows);

    const { GET } = await import("@/app/api/food/dates/route");
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(rows);
  });
});
