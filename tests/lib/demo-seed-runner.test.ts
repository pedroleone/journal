import { describe, expect, it, vi, beforeEach } from "vitest";

describe("runDemoSeed", () => {
  const deps = {
    getUserByEmail: vi.fn(),
    ensureDemoSeedImageCache: vi.fn(),
    buildDemoSeedData: vi.fn(),
    preflightStorage: vi.fn(),
    resetDemoSeedUserData: vi.fn(),
    persistDemoSeedData: vi.fn(),
    log: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    deps.getUserByEmail.mockReset();
    deps.ensureDemoSeedImageCache.mockReset();
    deps.buildDemoSeedData.mockReset();
    deps.preflightStorage.mockReset();
    deps.resetDemoSeedUserData.mockReset();
    deps.persistDemoSeedData.mockReset();
    deps.log.mockReset();
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

  it("resets the user, prepares cached images, and persists the seeded dataset", async () => {
    const seedData = {
      journalEntries: [],
      foodEntries: [],
      notes: [],
      noteSubnotes: [],
      libraryItems: [],
      libraryNotes: [],
      imageRefs: new Set(["desk-book"]),
    };
    deps.getUserByEmail.mockResolvedValueOnce({ id: "user-1", email: "seed@example.com" });
    deps.ensureDemoSeedImageCache.mockResolvedValueOnce({ "desk-book": "/tmp/desk-book.jpg" });
    deps.buildDemoSeedData.mockReturnValueOnce(seedData);
    deps.preflightStorage.mockResolvedValueOnce(undefined);
    deps.resetDemoSeedUserData.mockResolvedValueOnce(undefined);
    deps.persistDemoSeedData.mockResolvedValueOnce(undefined);

    const { runDemoSeed } = await import("@/lib/dev/demo-seed-runner");
    const result = await runDemoSeed(["--email", "seed@example.com"], deps);

    expect(deps.log).toHaveBeenCalledWith('Matched user: seed@example.com ("user-1")');
    expect(deps.ensureDemoSeedImageCache).toHaveBeenCalledOnce();
    expect(deps.buildDemoSeedData).toHaveBeenCalledWith("user-1");
    expect(deps.preflightStorage).toHaveBeenCalledWith({
      user: { id: "user-1", email: "seed@example.com" },
      seedData,
      cachedImages: { "desk-book": "/tmp/desk-book.jpg" },
    });
    expect(deps.resetDemoSeedUserData).toHaveBeenCalledWith("user-1");
    expect(deps.persistDemoSeedData).toHaveBeenCalledWith({
      user: { id: "user-1", email: "seed@example.com" },
      seedData,
      cachedImages: { "desk-book": "/tmp/desk-book.jpg" },
    });
    expect(result).toEqual({ user: { id: "user-1", email: "seed@example.com" } });
  });

  it("fails before reset when storage preflight fails", async () => {
    const seedData = {
      journalEntries: [],
      foodEntries: [],
      notes: [],
      noteSubnotes: [],
      libraryItems: [],
      libraryNotes: [],
      imageRefs: new Set(["desk-book"]),
    };
    deps.getUserByEmail.mockResolvedValueOnce({ id: "user-1", email: "seed@example.com" });
    deps.ensureDemoSeedImageCache.mockResolvedValueOnce({ "desk-book": "/tmp/desk-book.jpg" });
    deps.buildDemoSeedData.mockReturnValueOnce(seedData);
    deps.preflightStorage.mockRejectedValueOnce(new Error("storage down"));

    const { runDemoSeed } = await import("@/lib/dev/demo-seed-runner");

    await expect(runDemoSeed(["--email", "seed@example.com"], deps)).rejects.toThrow("storage down");
    expect(deps.resetDemoSeedUserData).not.toHaveBeenCalled();
    expect(deps.persistDemoSeedData).not.toHaveBeenCalled();
  });
});
