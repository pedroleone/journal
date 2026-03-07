import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

vi.mock("@/lib/r2", () => ({
  getEncryptedObject: vi.fn(),
  putEncryptedObject: vi.fn(),
}));

const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
};
const mockDb = vi.mocked(db) as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
};

describe("backup routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockResolvedValue(undefined);
  });

  it("exports journal, food, and image blobs", async () => {
    const { getEncryptedObject } = await import("@/lib/r2");
    mockDb.where
      .mockResolvedValueOnce([
        {
          id: "j-1",
          userId: "user-1",
          source: "web",
          year: 2026,
          month: 3,
          day: 7,
          hour: 9,
          encrypted_content: "cipher",
          iv: "iv",
          images: ["user-1/journal/j-1/photo.enc"],
          tags: null,
          created_at: "2026-03-07T10:00:00.000Z",
          updated_at: "2026-03-07T10:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "f-1",
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
          images: null,
          tags: null,
          created_at: "2026-03-07T12:00:00.000Z",
          updated_at: "2026-03-07T12:00:00.000Z",
        },
      ]);
    vi.mocked(getEncryptedObject).mockResolvedValue({
      body: new Uint8Array([1, 2, 3]),
      iv: "image-iv",
      contentType: "image/jpeg",
    });

    const { GET } = await import("@/app/api/backup/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.journal_entries).toHaveLength(1);
    expect(data.food_entries).toHaveLength(1);
    expect(data.image_blobs).toHaveLength(1);
  });

  it("restores a valid backup payload", async () => {
    const { putEncryptedObject } = await import("@/lib/r2");
    mockDb.where.mockResolvedValue([]);

    const { POST } = await import("@/app/api/backup/restore/route");
    const response = await POST(
      new NextRequest("http://localhost/api/backup/restore", {
        method: "POST",
        body: JSON.stringify({
          version: 1,
          exported_at: "2026-03-07T10:00:00.000Z",
          journal_entries: [],
          food_entries: [],
          image_blobs: [
            {
              key: "user-1/journal/j-1/photo.enc",
              iv: "image-iv",
              content_type: "image/jpeg",
              data: "AQID",
            },
          ],
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(putEncryptedObject).toHaveBeenCalled();
  });
});
