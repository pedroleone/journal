import { inspect } from "node:util";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

function authed() {
  mockAuth.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" } });
}

describe("GET /api/library/vocabulary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    mockDb.all.mockResolvedValue([{ value: "roguelike", count: 2 }]);
  });

  async function getVocabulary(params: Record<string, string> = {}) {
    const { GET } = await import("@/app/api/library/vocabulary/route");
    const url = new URL("http://localhost/api/library/vocabulary");
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return GET(new NextRequest(url));
  }

  it("filters genre suggestions by media type when provided", async () => {
    const res = await getVocabulary({ field: "genres", type: "game" });

    expect(res.status).toBe(200);
    expect(mockDb.all).toHaveBeenCalledTimes(1);
    expect(inspect(mockDb.all.mock.calls[0]?.[0], { depth: 8 })).toContain("game");
  });

  it("rejects invalid media types", async () => {
    const res = await getVocabulary({ field: "genres", type: "invalid-type" });

    expect(res.status).toBe(400);
  });
});
