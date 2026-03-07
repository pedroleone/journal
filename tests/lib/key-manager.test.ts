import { describe, it, expect, vi, beforeEach } from "vitest";

// Must import fresh module per test to reset state
let keyManager: typeof import("@/lib/key-manager");

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  keyManager = await import("@/lib/key-manager");
});

describe("key-manager", () => {
  it("keys return null initially", () => {
    expect(keyManager.getUserKey()).toBeNull();
    expect(keyManager.getServerKey()).toBeNull();
  });

  it("stores and retrieves both keys", () => {
    const fakeUserKey = { type: "secret" } as CryptoKey;
    const fakeServerKey = { type: "secret" } as CryptoKey;
    keyManager.setUserKey(fakeUserKey);
    keyManager.setServerKey(fakeServerKey);
    expect(keyManager.getUserKey()).toBe(fakeUserKey);
    expect(keyManager.getServerKey()).toBe(fakeServerKey);
  });

  it("wipeKeys clears both keys", () => {
    keyManager.setUserKey({ type: "secret" } as CryptoKey);
    keyManager.setServerKey({ type: "secret" } as CryptoKey);
    keyManager.wipeKeys();
    expect(keyManager.getUserKey()).toBeNull();
    expect(keyManager.getServerKey()).toBeNull();
  });

  it("wipeKeys triggers lock callback", () => {
    const cb = vi.fn();
    keyManager.onLock(cb);
    keyManager.setUserKey({ type: "secret" } as CryptoKey);
    keyManager.wipeKeys();
    expect(cb).toHaveBeenCalledOnce();
  });

  it("onLock cleanup unregisters the callback", () => {
    const cb = vi.fn();
    const cleanup = keyManager.onLock(cb);
    cleanup();
    keyManager.setUserKey({ type: "secret" } as CryptoKey);
    keyManager.wipeKeys();
    expect(cb).not.toHaveBeenCalled();
  });

  it("keys are wiped after 5 minutes of inactivity", () => {
    const cb = vi.fn();
    keyManager.onLock(cb);
    keyManager.setUserKey({ type: "secret" } as CryptoKey);
    keyManager.setServerKey({ type: "secret" } as CryptoKey);

    // Advance 4 minutes — key should still be there
    vi.advanceTimersByTime(4 * 60 * 1000);
    expect(keyManager.getUserKey()).not.toBeNull();
    expect(keyManager.getServerKey()).not.toBeNull();

    // Advance 1 more minute — key should be wiped
    vi.advanceTimersByTime(1 * 60 * 1000);
    expect(keyManager.getUserKey()).toBeNull();
    expect(keyManager.getServerKey()).toBeNull();
    expect(cb).toHaveBeenCalledOnce();
  });

  it("returns the correct key for each source", () => {
    const fakeUserKey = { type: "secret" } as CryptoKey;
    const fakeServerKey = { type: "secret" } as CryptoKey;
    keyManager.setUserKey(fakeUserKey);
    keyManager.setServerKey(fakeServerKey);

    expect(keyManager.getKeyForSource("web")).toBe(fakeUserKey);
    expect(keyManager.getKeyForSource("telegram")).toBe(fakeServerKey);
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
