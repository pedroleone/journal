import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { upsertGoogleUser } from "@/lib/auth/user";

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
