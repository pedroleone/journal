import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as serverCrypto from "@/lib/server-crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockServerCrypto = vi.mocked(serverCrypto);
const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("POST /api/food", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
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

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await postFood({ content: "Lunch" });
    expect(res.status).toBe(401);
  });

  it("returns 201 with id on valid input", async () => {
    const res = await postFood({
      content: "Lunch",
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.id).toBe("string");
    expect(mockServerCrypto.encryptServerText).toHaveBeenCalledWith("Lunch");
  });

  it("accepts image-first draft payloads", async () => {
    const res = await postFood({
      content: "",
      images: [],
    });
    expect(res.status).toBe(201);
  });

  it("creates entry with pre-assigned meal slot and date", async () => {
    const res = await postFood({
      content: "Oatmeal",
      meal_slot: "breakfast",
      year: 2026,
      month: 3,
      day: 9,
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.id).toBe("string");

    const insertedValues = mockDb.values.mock.calls[0][0];
    expect(insertedValues.meal_slot).toBe("breakfast");
    expect(insertedValues.year).toBe(2026);
    expect(insertedValues.month).toBe(3);
    expect(insertedValues.day).toBe(9);
    expect(insertedValues.assigned_at).not.toBeNull();
  });

  it("creates a skipped entry with empty content and tags", async () => {
    const res = await postFood({
      content: "",
      meal_slot: "lunch",
      year: 2026,
      month: 3,
      day: 9,
      tags: ["skipped"],
    });

    expect(res.status).toBe(201);

    const insertedValues = mockDb.values.mock.calls[0][0];
    expect(insertedValues.tags).toEqual(["skipped"]);
    expect(insertedValues.meal_slot).toBe("lunch");
  });

  it("rejects empty content without skipped tag or images", async () => {
    const res = await postFood({
      content: "",
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/food", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
  });

  async function getFood(params: Record<string, string> = {}) {
    const { GET } = await import("@/app/api/food/route");
    const url = new URL("http://localhost/api/food");
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    return GET(new NextRequest(url));
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await getFood();
    expect(res.status).toBe(401);
  });

  it("returns 200 with uncategorized list", async () => {
    const rows = [
      {
        id: "f1",
        source: "web",
        year: 2026,
        month: 3,
        day: 7,
        hour: 12,
        meal_slot: null,
        encrypted_content: "cipher",
        iv: "iv",
        logged_at: new Date().toISOString(),
        images: null,
      },
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
    expect(data[0].content).toBe("decrypted");
  });

  it("returns 400 on invalid query", async () => {
    const res = await getFood({ limit: "999" });
    expect(res.status).toBe(400);
  });
});
