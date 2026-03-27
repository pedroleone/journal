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
let mockTx: any;

function authed() {
  mockAuth.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" } });
}

function resetDb() {
  mockTx = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockResolvedValue([]);
  mockDb.insert.mockReturnThis();
  mockDb.transaction.mockImplementation(async (callback: (tx: typeof mockTx) => unknown) => callback(mockTx));
  mockDb.values.mockResolvedValue(undefined);
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
  mockDb.delete.mockReturnThis();
  mockDb.orderBy.mockResolvedValue([]);
}

function bookMetadata(overrides: Record<string, unknown> = {}) {
  return {
    bookFormat: "ebook",
    totalPages: null,
    currentProgressPercent: null,
    currentProgressPage: null,
    progressUpdatedAt: null,
    ...overrides,
  };
}

function bookItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    userId: "user-1",
    type: "book",
    title: "Book",
    status: "in_progress",
    metadata: bookMetadata(),
    ...overrides,
  };
}

function expectNoProgressWrites() {
  expect(mockTx.insert).not.toHaveBeenCalled();
  expect(mockTx.values).not.toHaveBeenCalled();
  expect(mockTx.update).not.toHaveBeenCalled();
  expect(mockTx.set).not.toHaveBeenCalled();
}

describe("POST /api/library/[id]/progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function postProgress(id: string, body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/library/[id]/progress/route");
    return POST(
      new NextRequest(`http://localhost/api/library/${id}/progress`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id }) },
    );
  }

  async function postMalformedProgress(id: string, body: string) {
    const { POST } = await import("@/app/api/library/[id]/progress/route");
    return POST(
      new NextRequest(`http://localhost/api/library/${id}/progress`, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id }) },
    );
  }

  it("logs ebook progress successfully", async () => {
    mockTx.where
      .mockResolvedValueOnce([bookItem()])
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const res = await postProgress("item-1", { progressPercent: 75 });

    expect(res.status).toBe(200);
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalledTimes(1);
    expect(mockTx.values).toHaveBeenCalledWith(
      expect.objectContaining({
        progress_kind: "percent",
        progress_value: 75,
        max_value: null,
      }),
    );
    expect(mockTx.update).toHaveBeenCalledTimes(1);
    expect(mockTx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        updated_at: expect.any(String),
        metadata: expect.objectContaining({
          bookFormat: "ebook",
          totalPages: null,
          currentProgressPercent: 75,
          currentProgressPage: null,
          progressUpdatedAt: expect.any(String),
        }),
      }),
    );
  });

  it("logs physical-book progress successfully", async () => {
    mockTx.where
      .mockResolvedValueOnce([
        bookItem({
          metadata: bookMetadata({
            bookFormat: "physical",
            totalPages: 320,
          }),
        }),
      ])
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const res = await postProgress("item-1", { currentPage: 120 });

    expect(res.status).toBe(200);
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalledTimes(1);
    expect(mockTx.values).toHaveBeenCalledWith(
      expect.objectContaining({
        progress_kind: "page",
        progress_value: 120,
        max_value: 320,
      }),
    );
    expect(mockTx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          bookFormat: "physical",
          totalPages: 320,
          currentProgressPercent: null,
          currentProgressPage: 120,
          progressUpdatedAt: expect.any(String),
        }),
      }),
    );
  });

  it("rejects progress for non-book items", async () => {
    mockTx.where.mockResolvedValueOnce([
      bookItem({
        type: "album",
        metadata: { platform: ["streaming"] },
      }),
    ]);

    const res = await postProgress("item-1", { progressPercent: 10 });

    expect(res.status).toBe(400);
    expectNoProgressWrites();
  });

  it("rejects progress for finished items", async () => {
    mockTx.where.mockResolvedValueOnce([
      bookItem({
        status: "finished",
      }),
    ]);

    const res = await postProgress("item-1", { progressPercent: 100 });

    expect(res.status).toBe(400);
    expectNoProgressWrites();
  });

  it.each([
    ["ebook", { currentPage: 10 }],
    ["physical", { progressPercent: 10 }],
  ])("rejects mismatched payloads for %s books", async (bookFormat, body) => {
    mockTx.where.mockResolvedValueOnce([
      bookItem({
        metadata: bookMetadata({
          bookFormat,
          totalPages: bookFormat === "physical" ? 320 : null,
        }),
      }),
    ]);

    const res = await postProgress("item-1", body);

    expect(res.status).toBe(400);
    expectNoProgressWrites();
  });

  it.each([-1, 101])("rejects percent value %s outside 0-100", async (progressPercent) => {
    mockTx.where.mockResolvedValueOnce([bookItem({ metadata: bookMetadata() })]);

    const res = await postProgress("item-1", { progressPercent });

    expect(res.status).toBe(400);
    expectNoProgressWrites();
  });

  it("rejects page values above totalPages", async () => {
    mockTx.where.mockResolvedValueOnce([
      bookItem({
        metadata: bookMetadata({
          bookFormat: "physical",
          totalPages: 320,
        }),
      }),
    ]);

    const res = await postProgress("item-1", { currentPage: 321 });

    expect(res.status).toBe(400);
    expectNoProgressWrites();
  });

  it("returns invalid input for malformed json", async () => {
    const res = await postMalformedProgress("item-1", "{");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid input" });
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });
});
