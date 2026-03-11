// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  });

  it("routes the journal tab to browse", () => {
    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open journal" }));

    expect(push).toHaveBeenCalledWith("/journal/browse");
  });

  it("routes the food tab to browse", () => {
    useModeMock.mockReturnValue({
      mode: "food",
      setMode: vi.fn(),
    });

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open food" }));

    expect(push).toHaveBeenCalledWith("/food/browse");
  });

  it("routes the notes tab to browse", () => {
    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open notes" }));

    expect(push).toHaveBeenCalledWith("/notes/browse");
  });

  it("sends food creation directly to the quick log", () => {
    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "New food entry" }));

    expect(push).toHaveBeenCalledWith("/food");
  });

  it("routes note creation directly to new note mode", () => {
    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "New note" }));

    expect(push).toHaveBeenCalledWith("/notes/browse?new=1");
  });

  it("opens today's existing journal entry directly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { id: "telegram-1", source: "telegram" },
        { id: "web-1", source: "web" },
      ]),
    });

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "New journal entry" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/journal/write?entry=web-1");
    });
  });

  it("falls back to the journal writer when no entry exists", async () => {
    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "New journal entry" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/journal/write");
    });
  });

  it("falls back to the journal writer when the journal lookup fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network"));

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "New journal entry" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/journal/write");
    });
  });

  it("marks the active section browse button", () => {
    useModeMock.mockReturnValue({
      mode: "notes",
      setMode: vi.fn(),
    });

    render(<AppNav />);

    expect(screen.getByRole("button", { name: "Open notes" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "Open journal" }).getAttribute("aria-current")).toBeNull();
  });
});
