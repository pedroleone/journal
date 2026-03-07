import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};
const mockDb = vi.mocked(db) as unknown as {
  select: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

describe("GET /api/entries/oldest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/journal/oldest/route");
    const res = await GET();

    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns the oldest entry for the current user", async () => {
    mockDb.limit.mockResolvedValueOnce([
      { encrypted_content: "ciphertext", iv: "entry-iv" },
    ]);

    const { GET } = await import("@/app/api/journal/oldest/route");
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    await expect(res.json()).resolves.toEqual({
      entry: { encrypted_content: "ciphertext", iv: "entry-iv" },
    });
  });
});
