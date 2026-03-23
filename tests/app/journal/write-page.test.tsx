// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WritePage from "@/app/journal/write/page";

const push = vi.fn();
const replace = vi.fn();
const useOnlineStatusMock = vi.fn();
const useSearchParamsMock = vi.fn();
const useAutoSaveMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: () => useOnlineStatusMock(),
}));

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({
    t: {
      localeCode: "en-US",
      journal: {
        connectionRequired: "Connection required",
        connectionRequiredDesc: "Reconnect to continue.",
        failedToLoadEntry: "Failed to load entry",
        failedToLoadJournalEntry: "Failed to load journal entry",
        offlineChanges: "Offline changes",
        back: "Back",
        startWriting: "Start writing",
        image: "Image",
        newThought: "New thought",
        saving: "Saving",
        saved: "Saved",
        saveFailed: "Save failed",
        offline: "Offline",
      },
    },
  }),
}));

vi.mock("@/components/ui/markdown-editor", () => ({
  MarkdownEditor: ({ className }: { className?: string }) => (
    <div data-testid="markdown-editor" className={className}>
      editor
    </div>
  ),
}));

vi.mock("@/components/image-lightbox", () => ({
  ImageLightbox: () => null,
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div>calendar</div>,
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/use-images", () => ({
  useImages: () => ({ images: [] }),
}));

vi.mock("@/hooks/use-auto-save", () => ({
  useAutoSave: () => useAutoSaveMock(),
}));

describe("WritePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnlineStatusMock.mockReturnValue(true);
    useSearchParamsMock.mockReturnValue(new URLSearchParams("year=2026&month=3&day=18"));
    useAutoSaveMock.mockReturnValue({ status: "idle", save: vi.fn() });
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/entries?")) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        });
      }

      if (url.includes("/api/entries/entry-1")) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue({
            id: "entry-1",
            source: "web",
            year: 2026,
            month: 3,
            day: 18,
            content: "Loaded entry",
            images: [],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });
    }) as typeof fetch;
  });

  it("uses the selected query date as the writing date", async () => {
    const { container } = render(<WritePage />);

    expect(await screen.findByRole("button", { name: /wednesday, march 18, 2026/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /browse entries/i }).getAttribute("href")).toBe(
      "/journal/browse?date=2026-03-18",
    );
    expect(screen.getByTestId("markdown-editor").className).toContain("journal-prose");
    expect(container.querySelector(".journal-meta-row")).toBeNull();
    expect(container.querySelector(".journal-browse-shell")).toBeNull();
  });

  it("does not render the old archive browser while editing", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("entry=entry-1"));
    useAutoSaveMock.mockReturnValue({ status: "saved", save: vi.fn() });

    render(<WritePage />);

    await screen.findByText(/editing/i);
    expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
  });

  it("renders editing in the same flat structure as browse", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("entry=entry-1"));
    useAutoSaveMock.mockReturnValue({ status: "saved", save: vi.fn() });

    const { container } = render(<WritePage />);

    expect(await screen.findByRole("link", { name: /browse entries/i })).toBeTruthy();
    expect(container.querySelector(".journal-meta-row")).toBeNull();
    expect(container.querySelector(".journal-browse-shell")).toBeNull();
    expect(screen.getAllByText(/saved/i).length).toBeGreaterThan(0);
  });
});
