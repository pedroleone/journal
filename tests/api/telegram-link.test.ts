import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

vi.mock("@/lib/auth/user", () => ({
  unlinkTelegramChatId: vi.fn(),
  setTelegramLinkToken: vi.fn(),
}));

function authed() {
  mockAuth.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" } });
}

function resetDb() {
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockResolvedValue([]);
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
}

describe("GET /api/telegram/link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/telegram/link/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns linked: false when no chat ID", async () => {
    mockDb.where.mockResolvedValueOnce([{ telegramChatId: null }]);
    const { GET } = await import("@/app/api/telegram/link/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.linked).toBe(false);
    expect(data.chatId).toBeNull();
  });

  it("returns linked: true when chat ID exists", async () => {
    mockDb.where.mockResolvedValueOnce([{ telegramChatId: "123456" }]);
    const { GET } = await import("@/app/api/telegram/link/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.linked).toBe(true);
    expect(data.chatId).toBe("123456");
  });
});

describe("DELETE /api/telegram/link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { DELETE } = await import("@/app/api/telegram/link/route");
    const res = await DELETE();
    expect(res.status).toBe(401);
  });

  it("calls unlinkTelegramChatId and returns ok", async () => {
    const authUser = await import("@/lib/auth/user");
    vi.mocked(authUser.unlinkTelegramChatId).mockResolvedValue(undefined);

    const { DELETE } = await import("@/app/api/telegram/link/route");
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(authUser.unlinkTelegramChatId).toHaveBeenCalledWith("user-1");
  });
});

describe("POST /api/telegram/link/token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
    authed();
    resetDb();
    process.env.TELEGRAM_BOT_USERNAME = "MyJournalBot";
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/telegram/link/token/route");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("generates token and returns deepLink", async () => {
    const authUser = await import("@/lib/auth/user");
    vi.mocked(authUser.setTelegramLinkToken).mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/telegram/link/token/route");
    const res = await POST();
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(typeof data.token).toBe("string");
    expect(data.token.length).toBeGreaterThan(0);
    expect(data.deepLink).toContain("t.me/MyJournalBot");
    expect(data.deepLink).toContain(data.token);
    expect(authUser.setTelegramLinkToken).toHaveBeenCalledWith(
      "user-1",
      data.token,
      expect.any(String),
    );
  });

  it("sets expiry ~10 minutes in the future", async () => {
    const authUser = await import("@/lib/auth/user");
    vi.mocked(authUser.setTelegramLinkToken).mockResolvedValue(undefined);

    const before = Date.now();
    const { POST } = await import("@/app/api/telegram/link/token/route");
    await POST();
    const after = Date.now();

    const [, , expiresAt] = vi.mocked(authUser.setTelegramLinkToken).mock.calls[0];
    const expiryMs = new Date(expiresAt as string).getTime();
    expect(expiryMs).toBeGreaterThanOrEqual(before + 9 * 60 * 1000);
    expect(expiryMs).toBeLessThanOrEqual(after + 10 * 60 * 1000 + 1000);
  });

  it("returns null deepLink when TELEGRAM_BOT_USERNAME is not set", async () => {
    delete process.env.TELEGRAM_BOT_USERNAME;
    const authUser = await import("@/lib/auth/user");
    vi.mocked(authUser.setTelegramLinkToken).mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/telegram/link/token/route");
    const res = await POST();
    const data = await res.json();
    expect(data.deepLink).toBeNull();
  });
});
