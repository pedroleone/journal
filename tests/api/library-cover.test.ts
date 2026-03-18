import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as serverCrypto from "@/lib/server-crypto";

vi.mock("@/lib/r2", () => ({
  putEncryptedObject: vi.fn().mockResolvedValue(undefined),
  deleteEncryptedObject: vi.fn().mockResolvedValue(undefined),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockServerCrypto = vi.mocked(serverCrypto);
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

function createImageFile(size = 100) {
  return new File([new Uint8Array(size)], "cover.jpg", { type: "image/jpeg" });
}

describe("POST /api/library/[id]/cover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function postCover(id: string, file?: File) {
    const { POST } = await import("@/app/api/library/[id]/cover/route");
    const formData = new FormData();
    if (file) formData.append("file", file);
    return POST(
      new NextRequest(`http://localhost/api/library/${id}/cover`, {
        method: "POST",
        body: formData,
      }),
      { params: Promise.resolve({ id }) },
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await postCover("item-1", createImageFile());
    expect(res.status).toBe(401);
  });

  it("returns 404 when item not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const res = await postCover("missing", createImageFile());
    expect(res.status).toBe(404);
  });

  it("returns 201 on successful upload", async () => {
    mockDb.where
      .mockResolvedValueOnce([{ id: "item-1", cover_image: null }])
      .mockResolvedValueOnce({ rowsAffected: 1 });
    const res = await postCover("item-1", createImageFile());
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.key).toBe("string");
    expect(mockServerCrypto.encryptServerBuffer).toHaveBeenCalled();
  });

  it("returns 413 when file is too large", async () => {
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "huge.jpg", { type: "image/jpeg" });
    const res = await postCover("item-1", bigFile);
    expect(res.status).toBe(413);
  });

  it("returns 400 when no file provided", async () => {
    const { POST } = await import("@/app/api/library/[id]/cover/route");
    const formData = new FormData();
    const res = await POST(
      new NextRequest("http://localhost/api/library/item-1/cover", {
        method: "POST",
        body: formData,
      }),
      { params: Promise.resolve({ id: "item-1" }) },
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/library/[id]/cover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  async function deleteCover(id: string) {
    const { DELETE } = await import("@/app/api/library/[id]/cover/route");
    return DELETE(
      new NextRequest(`http://localhost/api/library/${id}/cover`, { method: "DELETE" }),
      { params: Promise.resolve({ id }) },
    );
  }

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await deleteCover("item-1");
    expect(res.status).toBe(401);
  });

  it("returns 204 on successful deletion", async () => {
    mockDb.where
      .mockResolvedValueOnce([{ id: "item-1", cover_image: "user-1/library/item-1/abc.enc" }])
      .mockResolvedValueOnce({ rowsAffected: 1 });
    const res = await deleteCover("item-1");
    expect(res.status).toBe(204);
  });

  it("returns 404 when no cover image exists", async () => {
    mockDb.where.mockResolvedValueOnce([{ id: "item-1", cover_image: null }]);
    const res = await deleteCover("item-1");
    expect(res.status).toBe(404);
  });

  it("returns 404 when item not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const res = await deleteCover("missing");
    expect(res.status).toBe(404);
  });
});
