import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

function authed() {
  mockAuth.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" } });
}

function resetDb() {
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockResolvedValue([]);
  mockDb.insert.mockReturnThis();
  mockDb.values.mockResolvedValue(undefined);
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
  mockDb.delete.mockReturnThis();
  mockDb.orderBy.mockResolvedValue([]);
}

describe("POST /api/library/bulk-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function bulkUpdate(body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/library/bulk-status/route");
    return POST(
      new NextRequest("http://localhost/api/library/bulk-status", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await bulkUpdate({ ids: ["a"], status: "finished" });
    expect(res.status).toBe(401);
  });

  it("returns 400 with empty ids", async () => {
    const res = await bulkUpdate({ ids: [], status: "finished" });
    expect(res.status).toBe(400);
  });

  it("returns 400 with invalid status", async () => {
    const res = await bulkUpdate({ ids: ["a"], status: "invalid" });
    expect(res.status).toBe(400);
  });

  it("returns 200 with updated count", async () => {
    // Mock the select query to return items
    mockDb.where.mockResolvedValueOnce([
      { id: "item-1", started_at: null, finished_at: null },
      { id: "item-2", started_at: "2026-01-01T00:00:00.000Z", finished_at: null },
    ]);
    // Mock the two update calls
    mockDb.where
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const res = await bulkUpdate({ ids: ["item-1", "item-2"], status: "finished" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.updated).toBe(2);
  });

  it("applies auto-timestamps per item", async () => {
    mockDb.where.mockResolvedValueOnce([
      { id: "item-1", started_at: null, finished_at: null },
    ]);
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 1 });

    await bulkUpdate({ ids: ["item-1"], status: "finished" });

    // Verify set was called with both started_at and finished_at for an item with no prior timestamps
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "finished",
        started_at: expect.any(String),
        finished_at: expect.any(String),
      }),
    );
  });
});
