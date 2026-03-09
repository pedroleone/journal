import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import {
  upsertGoogleUser,
  getUserByTelegramChatId,
  getUserByTelegramLinkToken,
  setTelegramLinkToken,
  linkTelegramChatId,
  unlinkTelegramChatId,
} from "@/lib/auth/user";

const mockDb = vi.mocked(db) as unknown as Record<string, ReturnType<typeof vi.fn>>;

describe("upsertGoogleUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.insert.mockReturnThis();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.values.mockResolvedValue(undefined);
  });

  it("creates a new user for a new Google account", async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const user = await upsertGoogleUser({
      googleSub: "google-sub-1",
      email: "user@example.com",
    });

    expect(user.email).toBe("user@example.com");
    expect(mockDb.insert).toHaveBeenCalledOnce();
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        googleSub: "google-sub-1",
        email: "user@example.com",
      }),
    );
  });

  it("returns the existing user without updating when the email is unchanged", async () => {
    mockDb.where.mockResolvedValueOnce([
      { id: "user-1", email: "user@example.com" },
    ]);

    const user = await upsertGoogleUser({
      googleSub: "google-sub-1",
      email: "user@example.com",
    });

    expect(user).toEqual({ id: "user-1", email: "user@example.com" });
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("updates the email when the Google subject already exists with a different email", async () => {
    mockDb.where
      .mockResolvedValueOnce([{ id: "user-1", email: "old@example.com" }])
      .mockResolvedValueOnce(undefined);

    const user = await upsertGoogleUser({
      googleSub: "google-sub-1",
      email: "new@example.com",
    });

    expect(user).toEqual({ id: "user-1", email: "new@example.com" });
    expect(mockDb.update).toHaveBeenCalledOnce();
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
      }),
    );
  });
});

describe("getUserByTelegramChatId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
  });

  it("returns user when found", async () => {
    mockDb.where.mockResolvedValueOnce([{ id: "user-1", email: "a@b.com" }]);
    const user = await getUserByTelegramChatId("123456");
    expect(user).toEqual({ id: "user-1", email: "a@b.com" });
  });

  it("returns null when not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const user = await getUserByTelegramChatId("999");
    expect(user).toBeNull();
  });
});

describe("getUserByTelegramLinkToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
  });

  it("returns user with expiry when found", async () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    mockDb.where.mockResolvedValueOnce([
      { id: "user-1", email: "a@b.com", telegramLinkTokenExpiresAt: expiresAt },
    ]);
    const user = await getUserByTelegramLinkToken("MYTOKEN");
    expect(user?.id).toBe("user-1");
    expect(user?.telegramLinkTokenExpiresAt).toBe(expiresAt);
  });

  it("returns null when token not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    const user = await getUserByTelegramLinkToken("BADTOKEN");
    expect(user).toBeNull();
  });
});

describe("setTelegramLinkToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.where.mockResolvedValue(undefined);
  });

  it("calls update with token and expiry", async () => {
    const expiresAt = new Date(Date.now() + 600_000).toISOString();
    await setTelegramLinkToken("user-1", "MYTOKEN", expiresAt);
    expect(mockDb.update).toHaveBeenCalledOnce();
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        telegramLinkToken: "MYTOKEN",
        telegramLinkTokenExpiresAt: expiresAt,
      }),
    );
  });
});

describe("linkTelegramChatId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.where.mockResolvedValue(undefined);
  });

  it("sets chatId and clears token fields", async () => {
    await linkTelegramChatId("user-1", "123456");
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        telegramChatId: "123456",
        telegramLinkToken: null,
        telegramLinkTokenExpiresAt: null,
      }),
    );
  });
});

describe("unlinkTelegramChatId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.where.mockResolvedValue(undefined);
  });

  it("nulls chatId and token fields", async () => {
    await unlinkTelegramChatId("user-1");
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        telegramChatId: null,
        telegramLinkToken: null,
        telegramLinkTokenExpiresAt: null,
      }),
    );
  });
});
