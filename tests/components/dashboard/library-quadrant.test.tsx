// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LibraryQuadrant } from "@/components/dashboard/library-quadrant";

vi.mock("next/image", () => ({
  default: ({
    alt,
    className,
    height,
    src,
    width,
  }: {
    alt: string;
    className?: string;
    height: number;
    src: string;
    width: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      height={height}
      src={src}
      width={width}
    />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/dashboard/quadrant-card", () => ({
  QuadrantCard: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

describe("LibraryQuadrant", () => {
  const realDateNow = Date.now;

  function makeItem(
    id: string,
    overrides: Partial<{
      title: string;
      creator: string | null;
      type: string;
      status: "in_progress" | "finished" | "backlog";
      rating: number | null;
      cover_image: string | null;
      metadata: Record<string, unknown> | null;
      added_at: string;
      finished_at: string | null;
      updated_at: string;
    }> = {},
  ) {
    return {
      id,
      title: overrides.title ?? id,
      creator: overrides.creator ?? null,
      type: overrides.type ?? "book",
      status: overrides.status ?? "in_progress",
      rating: overrides.rating ?? null,
      cover_image: overrides.cover_image ?? null,
      metadata: overrides.metadata ?? null,
      added_at: overrides.added_at ?? "2026-03-01T00:00:00.000Z",
      finished_at: overrides.finished_at ?? null,
      updated_at: overrides.updated_at ?? "2026-03-01T00:00:00.000Z",
    };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-03-24T12:00:00.000Z").getTime());
  });

  afterEach(() => {
    Date.now = realDateNow;
  });

  it("encodes cover image keys in dashboard thumbnail URLs", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          {
            id: "item-1",
            title: "Bluets",
            creator: "Maggie Nelson",
            type: "book",
            status: "in_progress",
            rating: null,
            cover_image: "user-1/library/item-1/cover image.enc",
            added_at: "2026-03-01T00:00:00.000Z",
            finished_at: null,
            updated_at: "2026-03-20T00:00:00.000Z",
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response);

    const { container } = render(<LibraryQuadrant />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    await waitFor(() => {
      const image = container.querySelector("img");
      expect(image?.getAttribute("src")).toBe(
        "/api/images/user-1%2Flibrary%2Fitem-1%2Fcover%20image.enc",
      );
    });
  });

  it("shows saved ebook progress percentages on in-progress rows", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("ebook-1", {
            title: "Saved Ebook Progress",
            type: "book",
            status: "in_progress",
            metadata: {
              bookFormat: "ebook",
              totalPages: null,
              currentProgressPercent: 45,
              currentProgressPage: null,
              totalDurationMinutes: null,
              currentProgressMinutes: null,
              progressUpdatedAt: "2026-03-23T00:00:00.000Z",
            },
          }),
        ],
      } as Response)
      .mockResolvedValueOnce({ json: async () => [] } as Response)
      .mockResolvedValueOnce({ json: async () => [] } as Response);

    render(<LibraryQuadrant />);

    expect(await screen.findByText("45%")).toBeTruthy();
  });

  it("places the percentage before the status pill on in-progress rows", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("ebook-1", {
            title: "Ordered Progress",
            type: "book",
            status: "in_progress",
            metadata: {
              bookFormat: "ebook",
              totalPages: null,
              currentProgressPercent: 45,
              currentProgressPage: null,
              totalDurationMinutes: null,
              currentProgressMinutes: null,
              progressUpdatedAt: "2026-03-23T00:00:00.000Z",
            },
          }),
        ],
      } as Response)
      .mockResolvedValueOnce({ json: async () => [] } as Response)
      .mockResolvedValueOnce({ json: async () => [] } as Response);

    render(<LibraryQuadrant />);

    const row = await screen.findByText("Ordered Progress");
    const link = row.closest("a");
    expect(link).toBeTruthy();

    const spans = link?.querySelectorAll("span");
    expect(spans?.[0].textContent).toBe("45%");
    expect(spans?.[1].textContent).toBe("in progress");
  });

  it("shows derived physical book progress percentages on in-progress rows", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("physical-1", {
            title: "Derived Physical Progress",
            type: "book",
            status: "in_progress",
            metadata: {
              bookFormat: "physical",
              totalPages: 500,
              currentProgressPercent: null,
              currentProgressPage: 125,
              totalDurationMinutes: null,
              currentProgressMinutes: null,
              progressUpdatedAt: "2026-03-23T00:00:00.000Z",
            },
          }),
        ],
      } as Response)
      .mockResolvedValueOnce({ json: async () => [] } as Response)
      .mockResolvedValueOnce({ json: async () => [] } as Response);

    render(<LibraryQuadrant />);

    expect(await screen.findByText("25%")).toBeTruthy();
  });

  it("does not show progress percentages for non-book or non-in-progress rows", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("book-backlog", {
            title: "Backlog Book",
            type: "book",
            status: "backlog",
            metadata: {
              bookFormat: "ebook",
              totalPages: null,
              currentProgressPercent: 80,
              currentProgressPage: null,
              totalDurationMinutes: null,
              currentProgressMinutes: null,
              progressUpdatedAt: "2026-03-23T00:00:00.000Z",
            },
          }),
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("album-progress", {
            title: "In Progress Album",
            type: "album",
            status: "in_progress",
            metadata: {
              bookFormat: "physical",
              totalPages: 200,
              currentProgressPercent: null,
              currentProgressPage: 50,
              totalDurationMinutes: null,
              currentProgressMinutes: null,
              progressUpdatedAt: "2026-03-23T00:00:00.000Z",
            },
          }),
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("finished-book", {
            title: "Finished Book",
            type: "book",
            status: "finished",
            metadata: {
              bookFormat: "physical",
              totalPages: 200,
              currentProgressPercent: null,
              currentProgressPage: 200,
              totalDurationMinutes: null,
              currentProgressMinutes: null,
              progressUpdatedAt: "2026-03-23T00:00:00.000Z",
            },
          }),
        ],
      } as Response);

    render(<LibraryQuadrant />);

    await waitFor(() => {
      expect(screen.queryByText("80%")).toBeNull();
      expect(screen.queryByText("25%")).toBeNull();
      expect(screen.queryByText("100%")).toBeNull();
    });
  });

  it("hides invalid book progress data on rows", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("ebook-invalid", {
            title: "Invalid Ebook Progress",
            type: "book",
            status: "in_progress",
            metadata: {
              bookFormat: "ebook",
              totalPages: null,
              currentProgressPercent: 101,
              currentProgressPage: null,
              totalDurationMinutes: null,
              currentProgressMinutes: null,
              progressUpdatedAt: "2026-03-23T00:00:00.000Z",
            },
          }),
          makeItem("physical-invalid", {
            title: "Invalid Physical Progress",
            type: "book",
            status: "in_progress",
            metadata: {
              bookFormat: "physical",
              totalPages: 500,
              currentProgressPercent: null,
              currentProgressPage: 501,
              totalDurationMinutes: null,
              currentProgressMinutes: null,
              progressUpdatedAt: "2026-03-23T00:00:00.000Z",
            },
          }),
        ],
      } as Response)
      .mockResolvedValueOnce({ json: async () => [] } as Response)
      .mockResolvedValueOnce({ json: async () => [] } as Response);

    render(<LibraryQuadrant />);

    await waitFor(() => {
      expect(screen.queryByText("101%")).toBeNull();
      expect(screen.queryByText("100%")).toBeNull();
    });
  });

  it("prioritises in-progress, then recent finished, then backlog up to 30 items", async () => {
    const ipItems = Array.from({ length: 28 }, (_, i) =>
      makeItem(`ip-${i + 1}`, {
        title: `In Progress ${i + 1}`,
        updated_at: `2026-03-${String(Math.min(24, 24 - (i % 24))).padStart(2, "0")}T${String(23 - Math.floor(i / 24)).padStart(2, "0")}:00:00.000Z`,
      }),
    );

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ json: async () => ipItems } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("fin-1", {
            title: "Recent Finish 1",
            status: "finished",
            finished_at: "2026-03-23T00:00:00.000Z",
            updated_at: "2026-03-23T00:00:00.000Z",
          }),
          makeItem("fin-2", {
            title: "Recent Finish 2",
            status: "finished",
            finished_at: "2026-03-22T00:00:00.000Z",
            updated_at: "2026-03-22T00:00:00.000Z",
          }),
          makeItem("fin-3", {
            title: "Recent Finish 3",
            status: "finished",
            finished_at: "2026-03-21T00:00:00.000Z",
            updated_at: "2026-03-21T00:00:00.000Z",
          }),
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("backlog-1", {
            title: "Backlog Item",
            status: "backlog",
            added_at: "2026-03-20T00:00:00.000Z",
          }),
        ],
      } as Response);

    render(<LibraryQuadrant />);

    // All 28 in-progress shown
    expect(await screen.findByText("In Progress 1")).toBeTruthy();
    expect(screen.getByText("In Progress 28")).toBeTruthy();
    // 2 of 3 recent finished fit (28 + 2 = 30)
    expect(screen.getByText("Recent Finish 1")).toBeTruthy();
    expect(screen.getByText("Recent Finish 2")).toBeTruthy();
    // 31st item cut off
    expect(screen.queryByText("Recent Finish 3")).toBeNull();
    expect(screen.queryByText("Backlog Item")).toBeNull();
  });

  it("ignores finished items older than 30 days regardless of available slots", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("ip-1", { title: "In Progress 1", updated_at: "2026-03-24T08:00:00.000Z" }),
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("fin-1", {
            title: "Finished Recent",
            status: "finished",
            finished_at: "2026-03-23T00:00:00.000Z",
            updated_at: "2026-03-23T00:00:00.000Z",
          }),
          makeItem("fin-2", {
            title: "Finished Old",
            status: "finished",
            finished_at: "2026-02-20T00:00:00.000Z",
            updated_at: "2026-02-20T00:00:00.000Z",
          }),
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("backlog-1", {
            title: "Backlog Item",
            status: "backlog",
            added_at: "2026-03-21T00:00:00.000Z",
            updated_at: "2026-03-21T00:00:00.000Z",
          }),
        ],
      } as Response);

    render(<LibraryQuadrant />);

    expect(await screen.findByRole("link", { name: /in progress 1/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /finished recent/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /backlog item/i })).toBeTruthy();
    // Old finished (>30 days) excluded by time filter
    expect(screen.queryByRole("link", { name: /finished old/i })).toBeNull();
  });
});
