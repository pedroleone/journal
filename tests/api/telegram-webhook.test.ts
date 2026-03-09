import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

vi.mock("@/lib/auth/user", () => ({
  getUserByTelegramChatId: vi.fn(),
  getUserByTelegramLinkToken: vi.fn(),
  linkTelegramChatId: vi.fn(),
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

const LINKED_CHAT_ID = 123456;

describe("POST /api/telegram/webhook", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockResolvedValue(undefined);

    const authUser = await import("@/lib/auth/user");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(authUser.getUserByTelegramChatId).mockResolvedValue({ id: "user-1", email: "user@example.com" } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(authUser.getUserByTelegramLinkToken).mockResolvedValue(null as any);
    vi.mocked(authUser.linkTelegramChatId).mockResolvedValue(undefined);

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

  function makeRequest(body: unknown) {
    return new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Bot-Api-Secret-Token": "telegram-secret",
      },
      body: JSON.stringify(body),
    });
  }

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
      makeRequest({
        message: {
          date: 1_778_000_000,
          text: "/idea save this",
          chat: { id: LINKED_CHAT_ID },
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("treats plain text messages as food entries", async () => {
    const { POST } = await import("@/app/api/telegram/webhook/route");
    const response = await POST(
      makeRequest({
        message: {
          date: 1_778_000_000,
          text: "coffee and toast",
          chat: { id: LINKED_CHAT_ID },
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("stores a food entry with a Telegram photo", async () => {
    const { putEncryptedObject } = await import("@/lib/r2");
    const { POST } = await import("@/app/api/telegram/webhook/route");
    const response = await POST(
      makeRequest({
        message: {
          date: 1_778_000_000,
          caption: "/food",
          photo: [
            { file_id: "small", file_unique_id: "s", width: 100, height: 100 },
            { file_id: "large", file_unique_id: "l", width: 1000, height: 1000 },
          ],
          chat: { id: LINKED_CHAT_ID },
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(putEncryptedObject).toHaveBeenCalled();
  });

  it("replies with not-linked message for unknown chat", async () => {
    const authUser = await import("@/lib/auth/user");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(authUser.getUserByTelegramChatId).mockResolvedValue(null as any);

    const { POST } = await import("@/app/api/telegram/webhook/route");
    const response = await POST(
      makeRequest({
        message: {
          date: 1_778_000_000,
          text: "coffee",
          chat: { id: 999999 },
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDb.insert).not.toHaveBeenCalled();

    const sendCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (call: unknown[]) => String(call[0]).includes("sendMessage"),
    );
    expect(sendCall).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const body = JSON.parse(sendCall![1].body as string) as { text: string };
    expect(body.text).toContain("not linked");
  });

  it("links chat on valid /start token", async () => {
    const authUser = await import("@/lib/auth/user");
    vi.mocked(authUser.getUserByTelegramLinkToken).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      telegramLinkTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const { POST } = await import("@/app/api/telegram/webhook/route");
    await POST(
      makeRequest({
        message: {
          date: 1_778_000_000,
          text: "/start VALIDTOK",
          chat: { id: 777 },
        },
      }),
    );

    expect(authUser.linkTelegramChatId).toHaveBeenCalledWith("user-1", "777");
  });

  it("rejects /start with expired token", async () => {
    const authUser = await import("@/lib/auth/user");
    vi.mocked(authUser.getUserByTelegramLinkToken).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      telegramLinkTokenExpiresAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const { POST } = await import("@/app/api/telegram/webhook/route");
    const response = await POST(
      makeRequest({
        message: {
          date: 1_778_000_000,
          text: "/start EXPIREDTOK",
          chat: { id: 777 },
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(authUser.linkTelegramChatId).not.toHaveBeenCalled();

    const sendCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (call: unknown[]) => String(call[0]).includes("sendMessage"),
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const body = JSON.parse(sendCall![1].body as string) as { text: string };
    expect(body.text).toContain("expired");
  });

  it("rejects /start with unknown token", async () => {
    const authUser = await import("@/lib/auth/user");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(authUser.getUserByTelegramLinkToken).mockResolvedValue(null as any);

    const { POST } = await import("@/app/api/telegram/webhook/route");
    await POST(
      makeRequest({
        message: {
          date: 1_778_000_000,
          text: "/start UNKNOWNTOK",
          chat: { id: 777 },
        },
      }),
    );

    expect(authUser.linkTelegramChatId).not.toHaveBeenCalled();
  });
});
