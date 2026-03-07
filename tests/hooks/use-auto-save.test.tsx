// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoSave } from "@/hooks/use-auto-save";

function StatusProbe() {
  const { status } = useAutoSave({
    entryId: null,
    content: "Draft entry",
    year: 2026,
    month: 3,
    day: 7,
    delayMs: 10,
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
});
