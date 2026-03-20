// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrowsePage from "@/app/journal/browse/page";

const push = vi.fn();
const replace = vi.fn();
const useMediaQueryMock = vi.fn();
const useOnlineStatusMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: (query: string) => useMediaQueryMock(query),
}));

vi.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: () => useOnlineStatusMock(),
}));

vi.mock("@/components/journal/date-tree", () => ({
  DateTree: ({
    dates,
    selected,
    onSelect,
  }: {
    dates: Array<{ id: string }>;
    selected: { year: number; month?: number; day?: number } | null;
    onSelect: (selection: { year: number; month?: number; day?: number }) => void;
  }) => (
    <div data-testid="date-tree">
      <div data-testid="date-count">{dates.length}</div>
      <div data-testid="selected-date">
        {selected
          ? `${selected.year}-${selected.month}-${selected.day}`
          : "none"}
      </div>
      <button onClick={() => onSelect({ year: 2026, month: 3, day: 6 })}>
        Wed, 06/03
      </button>
    </div>
  ),
}));

vi.mock("@/components/journal/entry-viewer", () => ({
  EntryViewer: ({
    year,
    month,
    day,
    actions,
  }: {
    year: number;
    month: number;
    day: number;
    actions?: React.ReactNode;
  }) => (
    <div data-testid="entry-viewer">
      <div data-testid="entry-viewer-actions">{actions}</div>
      <div data-testid="entry-viewer-date">{`${year}-${month}-${day}`}</div>
    </div>
  ),
}));

describe("BrowsePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnlineStatusMock.mockReturnValue(true);
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { id: "latest", year: 2026, month: 3, day: 7 },
        { id: "older", year: 2026, month: 3, day: 6 },
      ]),
    });
  });

  it("defaults to the most recent entry on desktop", async () => {
    useMediaQueryMock.mockReturnValue(false);

    render(<BrowsePage />);

    expect((await screen.findByTestId("entry-viewer-date")).textContent).toBe("2026-3-7");
    expect(screen.queryByTestId("date-tree")).toBeNull();
  });

  it("shows the most recent entry immediately on mobile", async () => {
    useMediaQueryMock.mockReturnValue(true);

    render(<BrowsePage />);

    expect((await screen.findByTestId("entry-viewer-date")).textContent).toBe("2026-3-7");
    expect(screen.queryByTestId("date-tree")).toBeNull();
    expect(screen.getByRole("button", { name: /archive/i })).toBeTruthy();
  });

  it("keeps the journal canvas visible and toggles the archive panel on desktop", async () => {
    useMediaQueryMock.mockReturnValue(false);

    render(<BrowsePage />);

    expect(await screen.findByTestId("entry-viewer")).toBeTruthy();

    const archiveButton = screen.getByRole("button", { name: /archive/i });
    expect(archiveButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(archiveButton);

    expect(screen.getByTestId("journal-archive-panel")).toBeTruthy();
    expect(archiveButton.getAttribute("aria-pressed")).toBe("true");
    expect(archiveButton.closest(".mb-6")).toBeNull();
  });

  it("uses the query-selected date instead of snapping to the latest entry", async () => {
    useMediaQueryMock.mockReturnValue(false);
    useSearchParamsMock.mockReturnValue(new URLSearchParams("date=2026-03-18"));

    render(<BrowsePage />);

    expect((await screen.findByTestId("entry-viewer-date")).textContent).toBe("2026-3-18");
  });

  it("does not render the improvised archive-aware heading", async () => {
    useMediaQueryMock.mockReturnValue(false);

    render(<BrowsePage />);

    await screen.findByTestId("entry-viewer");
    expect(screen.queryByText(/archive-aware journal/i)).toBeNull();
    expect(screen.getByRole("button", { name: /archive/i })).toBeTruthy();
  });

  it("closes the archive after selecting a date on mobile", async () => {
    useMediaQueryMock.mockReturnValue(true);

    render(<BrowsePage />);

    const archiveButton = await screen.findByRole("button", { name: /archive/i });
    fireEvent.click(archiveButton);
    fireEvent.click(screen.getByRole("button", { name: /wed, 06\/03/i }));

    expect(screen.queryByTestId("journal-archive-panel")).toBeNull();
    expect(screen.getByTestId("entry-viewer").textContent).toContain("2026-3-6");
  });

  it("replaces the explicit date query when selecting a different archive day", async () => {
    useMediaQueryMock.mockReturnValue(false);
    useSearchParamsMock.mockReturnValue(new URLSearchParams("date=2026-03-07"));

    render(<BrowsePage />);

    const archiveButton = await screen.findByRole("button", { name: /archive/i });
    fireEvent.click(archiveButton);
    fireEvent.click(screen.getByRole("button", { name: /wed, 06\/03/i }));

    expect(replace).toHaveBeenCalledWith("/journal/browse?date=2026-03-06");
  });

  it("keeps the browse viewer flat for an empty selected day", async () => {
    useMediaQueryMock.mockReturnValue(false);
    useSearchParamsMock.mockReturnValue(new URLSearchParams("date=2026-03-20"));

    const { container } = render(<BrowsePage />);

    await screen.findByTestId("entry-viewer");
    expect(container.querySelector(".journal-browse-shell")).toBeNull();
  });

  it("does not show extra browse metadata labels for populated days", async () => {
    useMediaQueryMock.mockReturnValue(false);
    useSearchParamsMock.mockReturnValue(new URLSearchParams("date=2026-03-19"));

    render(<BrowsePage />);

    await screen.findByTestId("entry-viewer");
    expect(screen.queryByText("Single entry")).toBeNull();
    expect(screen.queryByText("Includes images")).toBeNull();
    expect(screen.queryByText("Web entry")).toBeNull();
  });
});
