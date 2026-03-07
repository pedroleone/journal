import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as serverCrypto from "@/lib/server-crypto";

vi.mock("@/lib/r2", () => ({
  getEncryptedObject: vi.fn(),
  deleteEncryptedObject: vi.fn(),
  putEncryptedObject: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockServerCrypto = vi.mocked(serverCrypto);
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
      source: "web",
      year: 2026,
      month: 3,
      day: 6,
      created_at: "2026-03-06T08:00:00.000Z",
      updated_at: "2026-03-06T08:00:00.000Z",
      images: null,
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
    expect(data.content).toBe("decrypted");
    expect(data.encrypted_content).toBeUndefined();
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
      body: JSON.stringify({ content: "new content" }),
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
      body: JSON.stringify({ content: "new content" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(request, { params: makeParams("abc123") });

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockServerCrypto.encryptServerText).toHaveBeenCalledWith("new content");
  });

  it("returns 404 when the entry is not owned by the current user", async () => {
    mockDb.where.mockResolvedValueOnce({ rowsAffected: 0 });

    const { PUT } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "PUT",
      body: JSON.stringify({ content: "new content" }),
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
      body: JSON.stringify({ content: "" }),
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
    mockDb.select.mockReturnThis();
    mockDb.delete.mockReturnThis();
    mockDb.insert.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.values.mockResolvedValue(undefined);
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
    const { getEncryptedObject, deleteEncryptedObject } = await import("@/lib/r2");
    mockDb.where
      .mockResolvedValueOnce([
        {
          id: "abc123",
          userId: "user-1",
          source: "web",
          year: 2026,
          month: 3,
          day: 6,
          hour: 8,
          encrypted_content: "cipher",
          iv: "iv",
          images: ["user-1/journal/abc123/photo.enc"],
          tags: null,
          created_at: "2026-03-06T08:00:00.000Z",
          updated_at: "2026-03-06T08:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce({ rowsAffected: 1 });
    vi.mocked(getEncryptedObject).mockResolvedValue({
      body: new Uint8Array([1, 2, 3]),
      iv: "image-iv",
      contentType: "image/jpeg",
    });

    const { DELETE } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("abc123") });

    expect(res.status).toBe(204);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(mockDb.delete).toHaveBeenCalled();
    expect(deleteEncryptedObject).toHaveBeenCalledWith("user-1/journal/abc123/photo.enc");
  });

  it("returns 404 when deleting an entry owned by another user", async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { DELETE } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("abc123") });

    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("restores the entry and deleted blobs when image cleanup fails", async () => {
    const { getEncryptedObject, deleteEncryptedObject, putEncryptedObject } =
      await import("@/lib/r2");
    const entry = {
      id: "abc123",
      userId: "user-1",
      source: "web",
      year: 2026,
      month: 3,
      day: 6,
      hour: 8,
      encrypted_content: "cipher",
      iv: "iv",
      images: [
        "user-1/journal/abc123/photo-1.enc",
        "user-1/journal/abc123/photo-2.enc",
      ],
      tags: null,
      created_at: "2026-03-06T08:00:00.000Z",
      updated_at: "2026-03-06T08:00:00.000Z",
    };
    mockDb.where
      .mockResolvedValueOnce([entry])
      .mockResolvedValueOnce({ rowsAffected: 1 });
    vi.mocked(getEncryptedObject)
      .mockResolvedValueOnce({
        body: new Uint8Array([1, 2, 3]),
        iv: "iv-1",
        contentType: "image/jpeg",
      })
      .mockResolvedValueOnce({
        body: new Uint8Array([4, 5, 6]),
        iv: "iv-2",
        contentType: "image/png",
      });
    vi.mocked(deleteEncryptedObject)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("boom"));

    const { DELETE } = await import("@/app/api/entries/[id]/route");
    const request = new NextRequest("http://localhost/api/entries/abc123", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("abc123") });

    expect(res.status).toBe(500);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith(entry);
    expect(putEncryptedObject).toHaveBeenCalledWith({
      key: "user-1/journal/abc123/photo-1.enc",
      body: new Uint8Array([1, 2, 3]),
      iv: "iv-1",
      contentType: "image/jpeg",
    });
  });
});
