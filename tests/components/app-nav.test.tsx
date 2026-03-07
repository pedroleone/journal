// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppNav } from "@/components/app-nav";

const push = vi.fn();
const signOut = vi.fn();
const useModeMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}));

vi.mock("@/components/pwa/install-app-button", () => ({
  InstallAppButton: () => null,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    children: ReactNode;
  }) => (open ? <div data-testid="dialog-root">{children}</div> : null),
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/lib/mode-context", () => ({
  useMode: () => useModeMock(),
}));

describe("AppNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useModeMock.mockReturnValue({
      mode: "journal",
      setMode: vi.fn(),
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });
    window.confirm = vi.fn();
  });

  it("routes the journal tab to browse", () => {
    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Journal" }));

    expect(push).toHaveBeenCalledWith("/journal/browse");
  });

  it("routes the food tab to browse", () => {
    useModeMock.mockReturnValue({
      mode: "food",
      setMode: vi.fn(),
    });

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Food" }));

    expect(push).toHaveBeenCalledWith("/food/browse");
  });

  it("opens the chooser and sends food creation to the quick log", () => {
    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: /new/i }));
    fireEvent.click(screen.getByRole("button", { name: /food entry/i }));

    expect(push).toHaveBeenCalledWith("/food");
  });

  it("opens today's existing journal entry directly without confirmation", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { id: "telegram-1", source: "telegram" },
        { id: "web-1", source: "web" },
      ]),
    });

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: /new/i }));
    fireEvent.click(screen.getByRole("button", { name: /journal entry/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/journal/write?entry=web-1");
    });
    expect(window.confirm).not.toHaveBeenCalled();
  });
});
