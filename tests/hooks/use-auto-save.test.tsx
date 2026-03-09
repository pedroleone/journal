// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoSave } from "@/hooks/use-auto-save";

function StatusProbe({ intervalMs }: { intervalMs?: number } = {}) {
  const { status } = useAutoSave({
    entryId: null,
    content: "Draft entry",
    year: 2026,
    month: 3,
    day: 7,
    delayMs: 10,
    intervalMs,
  });

  return <div>{status}</div>;
}

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports offline and skips network writes while disconnected", async () => {
    render(<StatusProbe />);

    await screen.findByText("offline");

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends plaintext content when online", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: "entry-1" }),
    });

    render(<StatusProbe />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalled();

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(options).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(String(options?.body))).toMatchObject({
      content: "Draft entry",
      year: 2026,
      month: 3,
      day: 7,
      hour: expect.any(Number),
    });
  });

  it("interval fires save after intervalMs", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: "entry-1" }),
    });

    render(<StatusProbe intervalMs={5000} />);

    // Let debounce fire first (delayMs=10), then advance to interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
      await Promise.resolve();
    });

    const callsAfterDebounce = vi.mocked(global.fetch).mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
      await Promise.resolve();
    });

    expect(vi.mocked(global.fetch).mock.calls.length).toBeGreaterThan(callsAfterDebounce);
  });

  it("interval does not fire when offline", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    global.fetch = vi.fn();

    render(<StatusProbe intervalMs={5000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
      await Promise.resolve();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("no double-save when debounce and interval overlap", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });

    let resolveFirst: () => void;
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise<{ ok: boolean; json: () => Promise<{ id: string }> }>((resolve) => {
          resolveFirst = () =>
            resolve({ ok: true, json: async () => ({ id: "entry-1" }) });
        })
    );

    render(<StatusProbe intervalMs={10} />);

    // Advance so both debounce (10ms) and interval (10ms) fire simultaneously
    // without resolving the fetch yet — savingRef guard should prevent second call
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });

    // Resolve the in-flight fetch
    await act(async () => {
      resolveFirst!();
      await Promise.resolve();
    });

    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });
});
