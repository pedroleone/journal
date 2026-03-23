// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WritePage from "@/app/journal/write/page";

const useSearchParamsMock = vi.fn();
const useOnlineStatusMock = vi.fn();
const useAutoSaveMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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

describe("WritePage polish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchParamsMock.mockReturnValue(new URLSearchParams("year=2026&month=3&day=20"));
    useOnlineStatusMock.mockReturnValue(true);
    useAutoSaveMock.mockReturnValue({ status: "idle", save: vi.fn() });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    }) as typeof fetch;
  });

  it("renders the writer utility actions with one shared muted treatment", async () => {
    render(<WritePage />);

    const imageButton = await screen.findByRole("button", { name: /image/i });
    const thoughtButton = screen.getByRole("button", { name: /new thought/i });

    expect(imageButton.className).toBe(thoughtButton.className);
    expect(imageButton.className).toContain("journal-utility-action");
    expect(thoughtButton.hasAttribute("disabled")).toBe(false);
  });

  it("renders write controls without the old boxed meta row", async () => {
    const { container } = render(<WritePage />);

    await screen.findByRole("link", { name: /browse entries/i });
    expect(container.querySelector(".journal-meta-row")).toBeNull();
    expect(container.querySelector(".journal-browse-shell")).toBeNull();
  });
});
