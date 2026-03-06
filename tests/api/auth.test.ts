import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { hash } from "bcryptjs";

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    // Generate a fast hash for testing
    const testHash = await hash("testpassword", 4);
    process.env.PASSWORD_HASH = testHash;
    vi.resetModules();
  });

  async function postLogin(body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/auth/login/route");
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    return POST(request);
  }

  it("returns 200 and sets cookie on correct password", async () => {
    const res = await postLogin({ password: "testpassword" });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);

    const cookie = res.cookies.get("session");
    expect(cookie).toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
  });

  it("returns 401 on wrong password", async () => {
    const res = await postLogin({ password: "wrongpassword" });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Invalid password");
  });

  it("returns 400 on missing password", async () => {
    const res = await postLogin({});
    expect(res.status).toBe(400);
  });

  it("returns 400 on empty password", async () => {
    const res = await postLogin({ password: "" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears session cookie", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST();
    expect(res.status).toBe(200);

    const cookie = res.cookies.get("session");
    expect(cookie).toBeDefined();
    expect(cookie!.maxAge).toBe(0);
  });
});
