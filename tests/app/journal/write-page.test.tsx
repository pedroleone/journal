// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WritePage from "@/app/journal/write/page";

const push = vi.fn();
const replace = vi.fn();
const useMediaQueryMock = vi.fn();
const useOnlineStatusMock = vi.fn();
const useSearchParamsMock = vi.fn();
const useAutoSaveMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => useMediaQueryMock(),
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

vi.mock("@/components/ui/collapsible-sidebar", () => ({
  CollapsibleSidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/journal/date-tree", () => ({
  DateTree: () => <div>date-tree</div>,
}));

describe("WritePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMediaQueryMock.mockReturnValue(false);
    useOnlineStatusMock.mockReturnValue(true);
    useSearchParamsMock.mockReturnValue(new URLSearchParams("year=2026&month=3&day=18"));
    useAutoSaveMock.mockReturnValue({ status: "idle", save: vi.fn() });
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/entries/dates")) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        });
      }

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
    render(<WritePage />);

    expect(await screen.findByRole("button", { name: /wednesday, march 18, 2026/i })).toBeTruthy();
    expect(screen.getByTestId("markdown-editor").className).toContain("journal-prose");
  });

  it("does not render the desktop journal date tree while editing", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("entry=entry-1"));
    useAutoSaveMock.mockReturnValue({ status: "saved", save: vi.fn() });

    render(<WritePage />);

    await screen.findByText(/editing/i);
    expect(screen.queryByText("date-tree")).toBeNull();
  });

  it("renders the compact journal meta row for editing", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("entry=entry-1"));
    useAutoSaveMock.mockReturnValue({ status: "saved", save: vi.fn() });

    const { container } = render(<WritePage />);

    expect(await screen.findByText(/editing/i)).toBeTruthy();
    const metaRow = container.querySelector(".journal-meta-row");
    expect(metaRow?.textContent).toContain("Editing");
    expect(metaRow?.textContent).toContain("Saved");
  });
});
