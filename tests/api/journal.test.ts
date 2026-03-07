import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Access the mocked db
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;

describe("POST /api/journal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the chain mock
    mockDb.insert.mockReturnThis();
    mockDb.values.mockResolvedValue(undefined);
  });

  async function postEntry(body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/journal/route");
    const request = new NextRequest("http://localhost/api/journal", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    return POST(request);
  }

  const validBody = {
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

  it("returns 400 on missing encrypted_content", async () => {
    const rest = { ...validBody };
    delete (rest as { encrypted_content?: string }).encrypted_content;
    const res = await postEntry(rest);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/journal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function getEntries(params: Record<string, string> = {}) {
    const { GET } = await import("@/app/api/journal/route");
    const url = new URL("http://localhost/api/journal");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const request = new NextRequest(url);
    return GET(request);
  }

  it("returns 200 with array", async () => {
    const mockEntries = [
      { id: "1", year: 2026, month: 3, day: 6 },
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

  it("passes year filter to query", async () => {
    const mockResult: unknown[] = [];
    (mockResult as unknown as Record<string, unknown>).reverse = vi.fn().mockReturnValue([]);
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnValue(mockResult);

    const res = await getEntries({ year: "2026" });
    expect(res.status).toBe(200);
  });
});
