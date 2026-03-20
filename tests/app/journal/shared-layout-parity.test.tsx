// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrowsePage from "@/app/journal/browse/page";
import WritePage from "@/app/journal/write/page";

const push = vi.fn();
const replace = vi.fn();
const mediaQueryMock = vi.fn();
const onlineStatusMock = vi.fn();
const browseSearchParamsMock = vi.fn();
const writeSearchParamsMock = vi.fn();
const autoSaveMock = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({ push, replace }),
    useSearchParams: () => {
      const stack = new Error().stack ?? "";
      return stack.includes("WritePage")
        ? writeSearchParamsMock()
        : browseSearchParamsMock();
    },
  };
});

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => mediaQueryMock(),
}));

vi.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: () => onlineStatusMock(),
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
        offlineBrowse: "Offline browse",
        reconnectToLoad: "Reconnect to load",
        selectDate: "Select a date",
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
  useAutoSave: () => autoSaveMock(),
}));

describe("Journal layout parity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mediaQueryMock.mockReturnValue(false);
    onlineStatusMock.mockReturnValue(true);
    browseSearchParamsMock.mockReturnValue(new URLSearchParams("date=2026-03-19"));
    writeSearchParamsMock.mockReturnValue(new URLSearchParams("year=2026&month=3&day=20"));
    autoSaveMock.mockReturnValue({ status: "idle", save: vi.fn() });
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/entries/dates") {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue([
            { id: "entry-1", year: 2026, month: 3, day: 19 },
          ]),
        });
      }

      if (url.includes("/api/entries?year=2026&month=3&day=19")) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue([
            {
              id: "entry-1",
              source: "web",
              year: 2026,
              month: 3,
              day: 19,
              hour: null,
              content: "Browse entry",
              created_at: "2026-03-19T20:00:00.000Z",
              images: [],
            },
          ]),
        });
      }

      if (url.includes("/api/entries?year=2026&month=3&day=20")) {
        return Promise.resolve({
          ok: true,
          json: vi.fn().mockResolvedValue([]),
        });
      }

      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });
    }) as typeof fetch;
  });

  it("renders browse and write with the same flat archive action placement", async () => {
    const browse = render(<BrowsePage />);
    const browseArchiveButton = await screen.findByRole("button", { name: /archive/i });
    await screen.findByRole("button", { name: /archive/i });

    expect(browseArchiveButton.closest(".mb-6")).toBeNull();
    expect(document.querySelector(".journal-browse-shell")).toBeNull();

    browse.unmount();

    render(<WritePage />);

    const writeArchiveButton = await screen.findByRole("button", { name: /archive/i });
    expect(writeArchiveButton.closest(".mb-6")).toBeNull();
    expect(screen.getByTestId("markdown-editor").closest(".journal-browse-shell")).toBeNull();
  });
});
