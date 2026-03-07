import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

vi.mock("@/lib/auth/user", () => ({
  getPrimaryUser: vi.fn(),
}));

vi.mock("@/lib/server-crypto", () => ({
  encryptServerText: vi.fn(),
  encryptServerBuffer: vi.fn(),
}));

vi.mock("@/lib/r2", () => ({
  putEncryptedObject: vi.fn(),
}));

const mockDb = vi.mocked(db) as unknown as {
  insert: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
};

describe("POST /api/telegram/webhook", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockResolvedValue(undefined);
    const authUser = await import("@/lib/auth/user");
    vi.mocked(authUser.getPrimaryUser).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    });
    const serverCrypto = await import("@/lib/server-crypto");
    vi.mocked(serverCrypto.encryptServerText).mockResolvedValue({
      ciphertext: "ciphertext",
      iv: "iv",
    });
    vi.mocked(serverCrypto.encryptServerBuffer).mockResolvedValue({
      ciphertext: new Uint8Array([1, 2, 3]),
      iv: "image-iv",
    });
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("getFile")) {
        return new Response(
          JSON.stringify({ ok: true, result: { file_path: "photos/one.jpg" } }),
          { status: 200 },
        );
      }

      if (url.includes("/file/bot")) {
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;
  });

  it("rejects requests with the wrong secret token", async () => {
    const { POST } = await import("@/app/api/telegram/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": "wrong-secret",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("handles unsupported commands gracefully", async () => {
    const { POST } = await import("@/app/api/telegram/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": "telegram-secret",
        },
        body: JSON.stringify({
          message: {
            date: 1_778_000_000,
            text: "/idea save this",
            chat: { id: 123456 },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("treats plain text messages as food entries", async () => {
    const { POST } = await import("@/app/api/telegram/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": "telegram-secret",
        },
        body: JSON.stringify({
          message: {
            date: 1_778_000_000,
            text: "coffee and toast",
            chat: { id: 123456 },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("stores a food entry with a Telegram photo", async () => {
    const { putEncryptedObject } = await import("@/lib/r2");
    const { POST } = await import("@/app/api/telegram/webhook/route");
    const response = await POST(
      new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": "telegram-secret",
        },
        body: JSON.stringify({
          message: {
            date: 1_778_000_000,
            caption: "/food",
            photo: [
              { file_id: "small", file_unique_id: "s", width: 100, height: 100 },
              { file_id: "large", file_unique_id: "l", width: 1000, height: 1000 },
            ],
            chat: { id: 123456 },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(putEncryptedObject).toHaveBeenCalled();
  });
});
