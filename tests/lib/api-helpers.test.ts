import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as serverCrypto from "@/lib/server-crypto";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = vi.mocked(db) as any;
const mockAuth = auth as unknown as {
  mockReset: () => void;
  mockResolvedValue: (value: unknown) => void;
  mockResolvedValueOnce: (value: unknown) => void;
};

describe("withAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { withAuth } = await import("@/lib/api-helpers");
    const handler = withAuth(async (_userId, _request) => {
      return new (await import("next/server")).NextResponse("ok");
    });
    const req = new NextRequest("http://localhost/api/test");
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it("passes userId to handler when authenticated", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const { withAuth } = await import("@/lib/api-helpers");
    let receivedUserId = "";
    const handler = withAuth(async (userId, _request) => {
      receivedUserId = userId;
      return new (await import("next/server")).NextResponse("ok");
    });
    const req = new NextRequest("http://localhost/api/test");
    await handler(req);
    expect(receivedUserId).toBe("user-1");
  });

  it("resolves params for parameterized routes", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const { withAuth } = await import("@/lib/api-helpers");
    let receivedParams: Record<string, string> = {};
    const handler = withAuth<{ id: string }>(async (_userId, _request, { params }) => {
      receivedParams = params;
      return new (await import("next/server")).NextResponse("ok");
    });
    const req = new NextRequest("http://localhost/api/test/123");
    await handler(req, { params: Promise.resolve({ id: "123" }) });
    expect(receivedParams).toEqual({ id: "123" });
  });
});

describe("parseBody", () => {
  it("returns parsed data on valid input", async () => {
    const { parseBody } = await import("@/lib/api-helpers");
    const schema = z.object({ name: z.string() });
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await parseBody(req, schema);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("test");
  });

  it("returns 400 response on invalid input", async () => {
    const { parseBody } = await import("@/lib/api-helpers");
    const schema = z.object({ name: z.string() });
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: 123 }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await parseBody(req, schema);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.response.status).toBe(400);
  });
});

describe("parseQuery", () => {
  it("returns parsed data on valid query", async () => {
    const { parseQuery } = await import("@/lib/api-helpers");
    const schema = z.object({ year: z.coerce.number().optional() });
    const req = new NextRequest("http://localhost/api/test?year=2026");
    const result = parseQuery(req, schema, ["year"]);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.year).toBe(2026);
  });

  it("returns 400 response on invalid query", async () => {
    const { parseQuery } = await import("@/lib/api-helpers");
    const schema = z.object({ year: z.coerce.number() });
    const req = new NextRequest("http://localhost/api/test?year=abc");
    const result = parseQuery(req, schema, ["year"]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.response.status).toBe(400);
  });
});

describe("findOwned", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockResolvedValue([]);
  });

  it("returns null when not found", async () => {
    const { findOwned } = await import("@/lib/api-helpers");
    const { entries } = await import("@/lib/schema");
    const result = await findOwned(entries, "x", "user-1");
    expect(result).toBeNull();
  });

  it("returns record when found", async () => {
    const record = { id: "x", userId: "user-1" };
    mockDb.where.mockResolvedValue([record]);
    const { findOwned } = await import("@/lib/api-helpers");
    const { entries } = await import("@/lib/schema");
    const result = await findOwned(entries, "x", "user-1");
    expect(result).toEqual(record);
  });
});

describe("notFoundResponse / deleteNoContent", () => {
  it("notFoundResponse returns 404", async () => {
    const { notFoundResponse } = await import("@/lib/api-helpers");
    const res = notFoundResponse();
    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("deleteNoContent returns 204", async () => {
    const { deleteNoContent } = await import("@/lib/api-helpers");
    const res = deleteNoContent();
    expect(res.status).toBe(204);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("encryptContentFields", () => {
  it("returns encrypted_content and iv", async () => {
    const { encryptContentFields } = await import("@/lib/api-helpers");
    const result = await encryptContentFields("hello");
    expect(result).toEqual({ encrypted_content: "mock-ct", iv: "mock-iv" });
    expect(vi.mocked(serverCrypto.encryptServerText)).toHaveBeenCalledWith("hello");
  });
});

describe("decryptRecord / decryptRecords", () => {
  it("decryptRecord replaces encrypted fields with content", async () => {
    const { decryptRecord } = await import("@/lib/api-helpers");
    const record = { id: "1", encrypted_content: "ct", iv: "iv", other: "data" };
    const result = await decryptRecord(record);
    expect(result).toEqual({ id: "1", other: "data", content: "decrypted" });
    expect(result).not.toHaveProperty("encrypted_content");
    expect(result).not.toHaveProperty("iv");
  });

  it("decryptRecords works on arrays", async () => {
    const { decryptRecords } = await import("@/lib/api-helpers");
    const records = [
      { id: "1", encrypted_content: "ct1", iv: "iv1" },
      { id: "2", encrypted_content: "ct2", iv: "iv2" },
    ];
    const result = await decryptRecords(records);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "1", content: "decrypted" });
    expect(result[1]).toEqual({ id: "2", content: "decrypted" });
  });
});
