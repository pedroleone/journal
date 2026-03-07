import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;

describe("POST /api/food", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockResolvedValue(undefined);
  });

  async function postFood(body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/food/route");
    const request = new NextRequest("http://localhost/api/food", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    return POST(request);
  }

  it("returns 201 with id on valid input", async () => {
    const res = await postFood({
      encrypted_content: "cipher",
      iv: "iv",
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.id).toBe("string");
  });

  it("returns 400 on invalid input", async () => {
    const res = await postFood({
      encrypted_content: "",
      iv: "iv",
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/food", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function getFood(params: Record<string, string> = {}) {
    const { GET } = await import("@/app/api/food/route");
    const url = new URL("http://localhost/api/food");
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    return GET(new NextRequest(url));
  }

  it("returns 200 with uncategorized list", async () => {
    const rows = [
      { id: "f1", encrypted_content: "cipher", iv: "iv", logged_at: new Date().toISOString() },
    ];
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnValue(rows);

    const res = await getFood({ uncategorized: "true" });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].id).toBe("f1");
  });

  it("returns 400 on invalid query", async () => {
    const res = await getFood({ limit: "999" });
    expect(res.status).toBe(400);
  });
});
