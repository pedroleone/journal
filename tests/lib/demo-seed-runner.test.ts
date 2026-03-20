import { describe, expect, it, vi, beforeEach } from "vitest";

describe("runDemoSeed", () => {
  const deps = {
    getUserByEmail: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    deps.getUserByEmail.mockReset();
  });

  it("rejects when --email is missing", async () => {
    const { runDemoSeed } = await import("@/lib/dev/demo-seed-runner");

    await expect(runDemoSeed([], deps)).rejects.toThrow("--email is required");
  });

  it("rejects when the target user does not exist", async () => {
    deps.getUserByEmail.mockResolvedValueOnce(null);
    const { runDemoSeed } = await import("@/lib/dev/demo-seed-runner");

    await expect(runDemoSeed(["--email", "missing@example.com"], deps)).rejects.toThrow(
      'No user found for email "missing@example.com"',
    );
  });
});
