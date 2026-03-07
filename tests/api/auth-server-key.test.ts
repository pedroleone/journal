import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";

const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("GET /api/auth/server-key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/auth/server-key/route");
    const response = await GET();

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns the server secret for authenticated users", async () => {
    const { GET } = await import("@/app/api/auth/server-key/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      secret: "server-test-secret",
    });
  });
});
