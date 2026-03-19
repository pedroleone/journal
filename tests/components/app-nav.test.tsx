// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppNav } from "@/components/app-nav";

const push = vi.fn();
const signOut = vi.fn();
const useModeMock = vi.fn();
const useMediaQueryMock = vi.fn();
const toggleTheme = vi.fn();

const translations = {
  nav: {
    journal: "Journal",
    food: "Food",
    notes: "Notes",
    library: "Library",
    openJournal: "Open journal",
    openFood: "Open food",
    openNotes: "Open notes",
    openLibrary: "Open library",
    newJournalEntry: "New journal entry",
    newFoodEntry: "New food entry",
    newNote: "New note",
    newLibraryItem: "New library item",
    createNew: "Create new",
  },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}));

vi.mock("@/components/pwa/install-app-button", () => ({
  InstallAppButton: () => <div>Install</div>,
}));

vi.mock("@/lib/mode-context", () => ({
  useMode: () => useModeMock(),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: (query: string) => useMediaQueryMock(query),
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({
    locale: "en",
    t: translations,
    setLocale: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme,
  }),
}));

describe("AppNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMediaQueryMock.mockReturnValue(true);
    useModeMock.mockReturnValue({
      mode: "journal",
      setMode: vi.fn(),
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });
  });

  it("routes the journal tab to browse on desktop", () => {
    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open journal" }));

    expect(push).toHaveBeenCalledWith("/journal/browse");
  });

  it("routes the food tab to browse on desktop", () => {
    useModeMock.mockReturnValue({
      mode: "food",
      setMode: vi.fn(),
    });

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open food" }));

    expect(push).toHaveBeenCalledWith("/food/browse");
  });

  it("routes the notes tab to browse on desktop", () => {
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

  it("marks the active section browse button on desktop", () => {
    useModeMock.mockReturnValue({
      mode: "notes",
      setMode: vi.fn(),
    });

    render(<AppNav />);

    expect(screen.getByRole("button", { name: "Open notes" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "Open journal" }).getAttribute("aria-current")).toBeNull();
  });

  it("shows labels and utility actions on desktop", () => {
    render(<AppNav />);

    expect(screen.getByText("Journal")).toBeTruthy();
    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("Install")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("signs out from the desktop bar", async () => {
    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
    });
  });

  it("shows the mobile top and bottom bars instead of desktop actions", () => {
    useMediaQueryMock.mockReturnValue(false);
    useModeMock.mockReturnValue({
      mode: "notes",
      setMode: vi.fn(),
    });

    render(<AppNav />);

    expect(screen.getByText("Notes", { selector: "p" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("routes mobile tabs to browse pages", () => {
    useMediaQueryMock.mockReturnValue(false);

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open library" }));

    expect(push).toHaveBeenCalledWith("/library/browse");
  });

  it("opens the mobile create sheet, focuses the first option, and closes on escape", async () => {
    useMediaQueryMock.mockReturnValue(false);

    render(<AppNav />);

    const fab = screen.getByRole("button", { name: "Create new" });
    fireEvent.click(fab);

    const dialog = screen.getByRole("dialog", { name: "Create new" });
    expect(dialog).toBeTruthy();

    const firstOption = screen.getByRole("button", { name: "New journal entry" });
    await waitFor(() => {
      expect(document.activeElement).toBe(firstOption);
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Create new" })).toBeNull();
      expect(document.activeElement).toBe(fab);
    });
  });

  it("traps focus within the mobile create sheet options", async () => {
    useMediaQueryMock.mockReturnValue(false);

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Create new" }));

    const firstOption = screen.getByRole("button", { name: "New journal entry" });
    const lastOption = screen.getByRole("button", { name: "New library item" });

    await waitFor(() => {
      expect(document.activeElement).toBe(firstOption);
    });

    lastOption.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(firstOption);

    firstOption.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastOption);
  });

  it("routes mobile create actions from the sheet", async () => {
    useMediaQueryMock.mockReturnValue(false);

    render(<AppNav />);

    fireEvent.click(screen.getByRole("button", { name: "Create new" }));
    fireEvent.click(screen.getByRole("button", { name: "New note" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/notes/browse?new=1");
    });
  });
});
