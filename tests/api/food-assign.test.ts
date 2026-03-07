import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

describe("PATCH /api/food/[id]/assign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
  });

  it("assigns a food entry when found", async () => {
    mockDb.where
      .mockResolvedValueOnce([{ id: "food1" }])
      .mockResolvedValueOnce(undefined);

    const { PATCH } = await import("@/app/api/food/[id]/assign/route");
    const req = new NextRequest("http://localhost/api/food/food1/assign", {
      method: "PATCH",
      body: JSON.stringify({
        year: 2026,
        month: 3,
        day: 6,
        meal_slot: "lunch",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req, { params: makeParams("food1") });
    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns 404 when entry does not exist", async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { PATCH } = await import("@/app/api/food/[id]/assign/route");
    const req = new NextRequest("http://localhost/api/food/missing/assign", {
      method: "PATCH",
      body: JSON.stringify({
        year: 2026,
        month: 3,
        day: 6,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req, { params: makeParams("missing") });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid body", async () => {
    const { PATCH } = await import("@/app/api/food/[id]/assign/route");
    const req = new NextRequest("http://localhost/api/food/food1/assign", {
      method: "PATCH",
      body: JSON.stringify({
        year: 2026,
        month: 13,
        day: 6,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req, { params: makeParams("food1") });
    expect(res.status).toBe(400);
  });
});
