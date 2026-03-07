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

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

describe("GET /api/entries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123");
    const res = await GET(request, { params: makeParams("abc123") });

    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
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
    mockDb.from.mockReturnThis();
    mockDb.where.mockResolvedValue([entry]);

    const { GET } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123");
    const res = await GET(request, { params: makeParams("abc123") });

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const data = await res.json();
    expect(data.id).toBe("abc123");
  });

  it("returns 404 when not found", async () => {
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockResolvedValue([]);

    const { GET } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/nonexistent");
    const res = await GET(request, { params: makeParams("nonexistent") });

    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("PUT /api/entries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.where.mockResolvedValue({ rowsAffected: 1 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { PUT } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "PUT",
      body: JSON.stringify({ encrypted_content: "newcipher", iv: "newiv" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(request, { params: makeParams("abc123") });

    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
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
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("returns 404 when the entry is not owned by the current user", async () => {
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 0 });

    const { PUT } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "PUT",
      body: JSON.stringify({ encrypted_content: "newcipher", iv: "newiv" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(request, { params: makeParams("abc123") });

    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
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
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("DELETE /api/entries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    mockDb.delete.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockResolvedValue({ rowsAffected: 1 });
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("abc123") });

    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("deletes entry and returns 204", async () => {
    const { DELETE } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("abc123") });

    expect(res.status).toBe(204);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("returns 404 when deleting an entry owned by another user", async () => {
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 0 });

    const { DELETE } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("abc123") });

    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
