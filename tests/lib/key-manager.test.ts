import { describe, it, expect, vi, beforeEach } from "vitest";

// Must import fresh module per test to reset state
let keyManager: typeof import("@/lib/key-manager");

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  keyManager = await import("@/lib/key-manager");
});

describe("key-manager", () => {
  it("getKey returns null initially", () => {
    expect(keyManager.getKey()).toBeNull();
  });

  it("setKey stores key, getKey retrieves it", () => {
    const fakeKey = { type: "secret" } as CryptoKey;
    keyManager.setKey(fakeKey);
    expect(keyManager.getKey()).toBe(fakeKey);
  });

  it("wipeKey clears the key", () => {
    const fakeKey = { type: "secret" } as CryptoKey;
    keyManager.setKey(fakeKey);
    keyManager.wipeKey();
    expect(keyManager.getKey()).toBeNull();
  });

  it("wipeKey triggers lock callback", () => {
    const cb = vi.fn();
    keyManager.onLock(cb);
    keyManager.setKey({ type: "secret" } as CryptoKey);
    keyManager.wipeKey();
    expect(cb).toHaveBeenCalledOnce();
  });

  it("key is wiped after 5 minutes of inactivity", () => {
    const cb = vi.fn();
    keyManager.onLock(cb);
    keyManager.setKey({ type: "secret" } as CryptoKey);

    // Advance 4 minutes — key should still be there
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(keyManager.getKey()).not.toBeNull();

    // Advance 1 more minute — key should be wiped
    vi.advanceTimersByTime(1 * 60 * 1000);
    expect(keyManager.getKey()).toBeNull();
    expect(cb).toHaveBeenCalledOnce();
  });

  it("initActivityListeners returns a cleanup function", async () => {
    // Must stub window + document BEFORE importing the module
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    vi.resetModules();
    const km = await import("@/lib/key-manager");

    const cleanup = km.initActivityListeners();
    expect(typeof cleanup).toBe("function");
    expect(document.addEventListener).toHaveBeenCalled();

    cleanup();
    expect(document.removeEventListener).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
