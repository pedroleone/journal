// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoSave } from "@/hooks/use-auto-save";

vi.mock("@/lib/crypto", () => ({
  encrypt: vi.fn(),
}));

vi.mock("@/lib/key-manager", () => ({
  getUserKey: vi.fn(),
}));

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

  it("reports offline and skips network writes while disconnected", async () => {
    const { getUserKey } = await import("@/lib/key-manager");
    vi.mocked(getUserKey).mockReturnValue({ type: "secret" } as CryptoKey);

    render(<StatusProbe />);

    await waitFor(() => {
      expect(screen.getByText("offline")).toBeTruthy();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
