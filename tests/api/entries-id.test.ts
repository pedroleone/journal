import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

const mockDb = vi.mocked(db);

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

describe("GET /api/entries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns entry when found", async () => {
    const entry = {
      id: "abc123",
      type: "journal",
      encrypted_content: "cipher",
      iv: "iv",
      year: 2026,
      month: 3,
      day: 6,
    };
    mockDb.select.mockReturnThis();
    (mockDb as any).from.mockReturnThis();
    (mockDb as any).where.mockResolvedValue([entry]);

    const { GET } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123");
    const res = await GET(request, { params: makeParams("abc123") });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("abc123");
  });

  it("returns 404 when not found", async () => {
    mockDb.select.mockReturnThis();
    (mockDb as any).from.mockReturnThis();
    (mockDb as any).where.mockResolvedValue([]);

    const { GET } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/nonexistent");
    const res = await GET(request, { params: makeParams("nonexistent") });

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/entries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.update.mockReturnThis();
    (mockDb as any).set.mockReturnThis();
    (mockDb as any).where.mockResolvedValue(undefined);
  });

  it("updates entry with valid body", async () => {
    const { PUT } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "PUT",
      body: JSON.stringify({ encrypted_content: "newcipher", iv: "newiv" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(request, { params: makeParams("abc123") });

    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns 400 on invalid body", async () => {
    const { PUT } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "PUT",
      body: JSON.stringify({ encrypted_content: "" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(request, { params: makeParams("abc123") });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/entries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.delete.mockReturnThis();
    (mockDb as any).from.mockReturnThis();
    (mockDb as any).where.mockResolvedValue(undefined);
  });

  it("deletes entry and returns 204", async () => {
    const { DELETE } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("abc123") });

    expect(res.status).toBe(204);
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
