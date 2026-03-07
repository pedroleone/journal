import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as serverCrypto from "@/lib/server-crypto";

vi.mock("@/lib/r2", () => ({
  putEncryptedObject: vi.fn(),
  getEncryptedObject: vi.fn(),
  deleteEncryptedObject: vi.fn(),
}));

const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
};
const mockServerCrypto = vi.mocked(serverCrypto);
const mockDb = vi.mocked(db) as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
};

describe("image routes", () => {
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

  it("uploads an encrypted image and appends the key", async () => {
    const { putEncryptedObject } = await import("@/lib/r2");
    mockDb.where
      .mockResolvedValueOnce([{ id: "entry-1", images: ["existing.enc"] }])
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const { POST } = await import("@/app/api/images/upload/route");
    const formData = new FormData();
    formData.append("file", new File(["plain"], "photo.jpg", { type: "image/jpeg" }));
    formData.append("owner_kind", "journal");
    formData.append("owner_id", "entry-1");

    const response = await POST(
      new Request("http://localhost/api/images/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(201);
    expect(mockServerCrypto.encryptServerBuffer).toHaveBeenCalled();
    expect(putEncryptedObject).toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      key: expect.stringContaining("user-1/journal/entry-1/"),
    });
  });

  it("returns encrypted image bytes with IV header", async () => {
    const { getEncryptedObject } = await import("@/lib/r2");
    mockDb.where.mockResolvedValueOnce([
      { images: ["user-1/journal/entry-1/image.enc"] },
    ]);
    vi.mocked(getEncryptedObject).mockResolvedValue({
      body: new Uint8Array([1, 2, 3]),
      iv: "image-iv",
      contentType: "image/jpeg",
    });

    const { GET } = await import("@/app/api/images/[key]/route");
    const response = await GET(
      new NextRequest("http://localhost/api/images/user-1%2Fjournal%2Fentry-1%2Fimage.enc"),
      { params: Promise.resolve({ key: "user-1%2Fjournal%2Fentry-1%2Fimage.enc" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("X-Encryption-IV")).toBeNull();
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([4, 5, 6]));
  });

  it("deletes an encrypted image and removes the DB reference", async () => {
    const { deleteEncryptedObject } = await import("@/lib/r2");
    mockDb.where
      .mockResolvedValueOnce([{ images: ["user-1/journal/entry-1/image.enc"] }])
      .mockResolvedValueOnce([{ images: ["user-1/journal/entry-1/image.enc"] }])
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const { DELETE } = await import("@/app/api/images/[key]/route");
    const request = new NextRequest(
      "http://localhost/api/images/user-1%2Fjournal%2Fentry-1%2Fimage.enc?owner_kind=journal&owner_id=entry-1",
      { method: "DELETE" },
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ key: "user-1%2Fjournal%2Fentry-1%2Fimage.enc" }),
    });

    expect(response.status).toBe(200);
    expect(deleteEncryptedObject).toHaveBeenCalledWith(
      "user-1/journal/entry-1/image.enc",
    );
  });
});
