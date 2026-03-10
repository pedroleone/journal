import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("GET /api/food/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1");
    const res = await GET(request, { params: makeParams("food-1") });

    expect(res.status).toBe(401);
  });

  it("returns a decrypted food entry", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        id: "food-1",
        userId: "user-1",
        source: "web",
        year: 2026,
        month: 3,
        day: 7,
        hour: 12,
        meal_slot: "lunch",
        assigned_at: null,
        logged_at: "2026-03-07T12:00:00.000Z",
        encrypted_content: "cipher",
        iv: "iv",
        images: ["user-1/food/food-1/photo.enc"],
        tags: null,
        created_at: "2026-03-07T12:00:00.000Z",
        updated_at: "2026-03-07T12:00:00.000Z",
      },
    ]);

    const { GET } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1");
    const res = await GET(request, { params: makeParams("food-1") });

    expect(res.status).toBe(200);
    expect(mockServerCrypto.decryptServerText).toHaveBeenCalledWith("cipher", "iv");
    await expect(res.json()).resolves.toMatchObject({
      id: "food-1",
      content: "decrypted",
      meal_slot: "lunch",
      images: ["user-1/food/food-1/photo.enc"],
    });
  });

  it("returns 404 when not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { GET } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1");
    const res = await GET(request, { params: makeParams("food-1") });

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/food/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { PATCH } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1", {
      method: "PATCH",
      body: JSON.stringify({ content: "Updated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(request, { params: makeParams("food-1") });

    expect(res.status).toBe(401);
  });

  it("updates content and returns ok", async () => {
    // First call: ownership check
    mockDb.where
      .mockResolvedValueOnce([{ id: "food-1" }])
      // Second call: update
      .mockResolvedValueOnce(undefined);

    const { PATCH } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1", {
      method: "PATCH",
      body: JSON.stringify({ content: "Updated meal" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(request, { params: makeParams("food-1") });

    expect(res.status).toBe(200);
    expect(mockServerCrypto.encryptServerText).toHaveBeenCalledWith("Updated meal");
    await expect(res.json()).resolves.toMatchObject({ ok: true });
  });

  it("returns 404 when entry not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { PATCH } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1", {
      method: "PATCH",
      body: JSON.stringify({ content: "Updated" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(request, { params: makeParams("food-1") });

    expect(res.status).toBe(404);
  });

  it("returns 400 on empty content", async () => {
    const { PATCH } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1", {
      method: "PATCH",
      body: JSON.stringify({ content: "" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(request, { params: makeParams("food-1") });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/food/[id]", () => {
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
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("food-1") });

    expect(res.status).toBe(401);
  });

  it("deletes the food entry and its blobs", async () => {
    const { getEncryptedObject, deleteEncryptedObject } = await import("@/lib/r2");
    mockDb.where
      .mockResolvedValueOnce([
        {
          id: "food-1",
          userId: "user-1",
          source: "web",
          year: 2026,
          month: 3,
          day: 7,
          hour: 12,
          meal_slot: null,
          assigned_at: null,
          logged_at: "2026-03-07T12:00:00.000Z",
          encrypted_content: "cipher",
          iv: "iv",
          images: ["user-1/food/food-1/photo.enc"],
          tags: null,
          created_at: "2026-03-07T12:00:00.000Z",
          updated_at: "2026-03-07T12:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce({ rowsAffected: 1 });
    vi.mocked(getEncryptedObject).mockResolvedValue({
      body: new Uint8Array([1, 2, 3]),
      iv: "image-iv",
      contentType: "image/jpeg",
    });

    const { DELETE } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("food-1") });

    expect(res.status).toBe(204);
    expect(deleteEncryptedObject).toHaveBeenCalledWith("user-1/food/food-1/photo.enc");
  });

  it("returns 404 when not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { DELETE } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("food-1") });

    expect(res.status).toBe(404);
  });

  it("restores the food row and deleted blobs when cleanup fails", async () => {
    const { getEncryptedObject, deleteEncryptedObject, putEncryptedObject } =
      await import("@/lib/r2");
    const entry = {
      id: "food-1",
      userId: "user-1",
      source: "telegram",
      year: 2026,
      month: 3,
      day: 7,
      hour: 12,
      meal_slot: null,
      assigned_at: null,
      logged_at: "2026-03-07T12:00:00.000Z",
      encrypted_content: "cipher",
      iv: "iv",
      images: ["user-1/food/food-1/photo-1.enc", "user-1/food/food-1/photo-2.enc"],
      tags: null,
      created_at: "2026-03-07T12:00:00.000Z",
      updated_at: "2026-03-07T12:00:00.000Z",
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

    const { DELETE } = await import("@/app/api/food/[id]/route");
    const request = new NextRequest("http://localhost/api/food/food-1", {
      method: "DELETE",
    });
    const res = await DELETE(request, { params: makeParams("food-1") });

    expect(res.status).toBe(500);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith(entry);
    expect(putEncryptedObject).toHaveBeenCalledWith({
      key: "user-1/food/food-1/photo-1.enc",
      body: new Uint8Array([1, 2, 3]),
      iv: "iv-1",
      contentType: "image/jpeg",
    });
  });
});
