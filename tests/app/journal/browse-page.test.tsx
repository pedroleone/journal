// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrowsePage from "@/app/journal/browse/page";

const push = vi.fn();
const replace = vi.fn((href: string) => {
  const [, query = ""] = href.split("?");
  currentSearchParams = new URLSearchParams(query);
});
const useOnlineStatusMock = vi.fn();
const useSearchParamsMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: () => useOnlineStatusMock(),
}));

describe("BrowsePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnlineStatusMock.mockReturnValue(true);
    currentSearchParams = new URLSearchParams("date=2026-03-07");
    useSearchParamsMock.mockImplementation(() => currentSearchParams);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { id: "entry-1", year: 2026, month: 3, day: 7 },
        { id: "entry-2", year: 2026, month: 3, day: 5 },
      ]),
    });
  });

  it("renders the selected month calendar and no archive toggle", async () => {
    render(<BrowsePage />);

    expect(await screen.findByRole("heading", { name: /march 2026/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /previous month/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /next month/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
    expect(screen.queryByText(/no entry for this day/i)).toBeNull();
  });

  it("routes to the dedicated entry page when a populated day is selected", async () => {
    render(<BrowsePage />);

    fireEvent.click(await screen.findByRole("button", { name: /march 7, 2026/i }));

    expect(push).toHaveBeenCalledWith("/journal/entry/entry-1");
  });

  it("updates the browse URL when an empty day is selected", async () => {
    render(<BrowsePage />);

    fireEvent.click(await screen.findByRole("button", { name: /march 8, 2026/i }));

    expect(replace).toHaveBeenCalledWith("/journal/browse?date=2026-03-08");
  });

  it("shows an inline empty-day state with Write for this day when opened on an empty day", async () => {
    currentSearchParams = new URLSearchParams("date=2026-03-08");

    render(<BrowsePage />);

    await waitFor(() => {
      expect(screen.getByText(/no entry for this day/i)).toBeTruthy();
    });
    expect(screen.getByRole("link", { name: /write for this day/i }).getAttribute("href")).toBe(
      "/journal/write?year=2026&month=3&day=8",
    );
  });

  it("changes the visible month from the query-selected date", async () => {
    currentSearchParams = new URLSearchParams("date=2026-02-14");

    render(<BrowsePage />);

    expect(await screen.findByRole("heading", { name: /february 2026/i })).toBeTruthy();
  });

  it("shows offline browse messaging without archive-specific UI", async () => {
    useOnlineStatusMock.mockReturnValue(false);

    render(<BrowsePage />);

    expect(await screen.findByText(/you are offline/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
  });
});
