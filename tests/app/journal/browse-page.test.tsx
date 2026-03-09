// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrowsePage from "@/app/journal/browse/page";

const push = vi.fn();
const useMediaQueryMock = vi.fn();
const useOnlineStatusMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
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
  }: {
    dates: Array<{ id: string }>;
    selected: { year: number; month?: number; day?: number } | null;
  }) => (
    <div data-testid="date-tree">
      <div data-testid="date-count">{dates.length}</div>
      <div data-testid="selected-date">
        {selected
          ? `${selected.year}-${selected.month}-${selected.day}`
          : "none"}
      </div>
    </div>
  ),
}));

vi.mock("@/components/journal/entry-viewer", () => ({
  EntryViewer: ({
    year,
    month,
    day,
  }: {
    year: number;
    month: number;
    day: number;
  }) => <div data-testid="entry-viewer">{`${year}-${month}-${day}`}</div>,
}));

describe("BrowsePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnlineStatusMock.mockReturnValue(true);
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

    expect((await screen.findByTestId("entry-viewer")).textContent).toBe("2026-3-7");
    expect(screen.getByTestId("selected-date").textContent).toBe("2026-3-7");
    expect(screen.getByTestId("date-tree")).toBeTruthy();
  });

  it("shows the most recent entry immediately on mobile", async () => {
    useMediaQueryMock.mockReturnValue(true);

    render(<BrowsePage />);

    expect((await screen.findByTestId("entry-viewer")).textContent).toBe("2026-3-7");
    expect(screen.queryByTestId("date-tree")).toBeNull();
    expect(screen.getByRole("button", { name: /back/i })).toBeTruthy();
  });
});
