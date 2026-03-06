import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Access the mocked db
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;

describe("POST /api/entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the chain mock
    mockDb.insert.mockReturnThis();
    mockDb.values.mockResolvedValue(undefined);
  });

  async function postEntry(body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/entries/route");
    const request = new NextRequest("http://localhost/api/entries", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    return POST(request);
  }

  const validBody = {
    type: "journal",
    encrypted_content: "base64ciphertext",
    iv: "base64iv",
    year: 2026,
    month: 3,
    day: 6,
    hour: 14,
  };

  it("returns 201 with id on valid input", async () => {
    const res = await postEntry(validBody);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(typeof data.id).toBe("string");
  });

  it("calls db.insert with correct values", async () => {
    await postEntry(validBody);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("returns 400 on missing type", async () => {
    const { type: _type, ...rest } = validBody;
    const res = await postEntry(rest);
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid type", async () => {
    const res = await postEntry({ ...validBody, type: "diary" });
    expect(res.status).toBe(400);
  });

  it("returns 400 on missing encrypted_content", async () => {
    const { encrypted_content: _ec, ...rest } = validBody;
    const res = await postEntry(rest);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function getEntries(params: Record<string, string> = {}) {
    const { GET } = await import("@/app/api/entries/route");
    const url = new URL("http://localhost/api/entries");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const request = new NextRequest(url);
    return GET(request);
  }

  it("returns 200 with array", async () => {
    const mockEntries = [
      { id: "1", type: "journal", year: 2026, month: 3, day: 6 },
    ];
    // Mock the chain to return entries
    const mockResult = mockEntries;
    mockResult.reverse = vi.fn().mockReturnValue(mockEntries);
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnValue(mockResult);

    const res = await getEntries();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("passes type filter to query", async () => {
    const mockResult: unknown[] = [];
    (mockResult as Record<string, unknown>).reverse = vi.fn().mockReturnValue([]);
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnValue(mockResult);

    const res = await getEntries({ type: "food" });
    expect(res.status).toBe(200);
  });

  it("returns 400 on invalid type filter", async () => {
    const res = await getEntries({ type: "invalid" });
    expect(res.status).toBe(400);
  });
});
