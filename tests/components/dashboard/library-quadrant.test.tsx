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

  it("fills all six slots with in-progress items before recent finished or backlog items", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("ip-1", { title: "In Progress 1", updated_at: "2026-03-24T08:00:00.000Z" }),
          makeItem("ip-2", { title: "In Progress 2", updated_at: "2026-03-24T07:00:00.000Z" }),
          makeItem("ip-3", { title: "In Progress 3", updated_at: "2026-03-24T06:00:00.000Z" }),
          makeItem("ip-4", { title: "In Progress 4", updated_at: "2026-03-24T05:00:00.000Z" }),
          makeItem("ip-5", { title: "In Progress 5", updated_at: "2026-03-24T04:00:00.000Z" }),
          makeItem("ip-6", { title: "In Progress 6", updated_at: "2026-03-24T03:00:00.000Z" }),
          makeItem("ip-7", { title: "In Progress 7", updated_at: "2026-03-24T02:00:00.000Z" }),
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("fin-1", {
            title: "Recent Finish",
            status: "finished",
            finished_at: "2026-03-23T00:00:00.000Z",
            updated_at: "2026-03-23T00:00:00.000Z",
          }),
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("backlog-1", {
            title: "Backlog Item",
            status: "backlog",
            added_at: "2026-03-22T00:00:00.000Z",
            updated_at: "2026-03-22T00:00:00.000Z",
          }),
        ],
      } as Response);

    render(<LibraryQuadrant />);

    expect(await screen.findByRole("link", { name: /in progress 1/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /in progress 6/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /in progress 7/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /recent finish/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /backlog item/i })).toBeNull();
  });

  it("uses recent finished items before backlog and ignores finished items older than 30 days", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("ip-1", { title: "In Progress 1", updated_at: "2026-03-24T08:00:00.000Z" }),
          makeItem("ip-2", { title: "In Progress 2", updated_at: "2026-03-24T07:00:00.000Z" }),
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [
          makeItem("fin-1", {
            title: "Finished Recent 1",
            status: "finished",
            finished_at: "2026-03-23T00:00:00.000Z",
            updated_at: "2026-03-23T00:00:00.000Z",
          }),
          makeItem("fin-2", {
            title: "Finished Recent 2",
            status: "finished",
            finished_at: "2026-03-10T00:00:00.000Z",
            updated_at: "2026-03-10T00:00:00.000Z",
          }),
          makeItem("fin-3", {
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
            title: "Backlog Newer",
            status: "backlog",
            added_at: "2026-03-21T00:00:00.000Z",
            updated_at: "2026-03-21T00:00:00.000Z",
          }),
          makeItem("backlog-2", {
            title: "Backlog Older",
            status: "backlog",
            added_at: "2026-03-18T00:00:00.000Z",
            updated_at: "2026-03-18T00:00:00.000Z",
          }),
          makeItem("backlog-3", {
            title: "Backlog Oldest",
            status: "backlog",
            added_at: "2026-03-15T00:00:00.000Z",
            updated_at: "2026-03-15T00:00:00.000Z",
          }),
        ],
      } as Response);

    render(<LibraryQuadrant />);

    expect(await screen.findByRole("link", { name: /finished recent 1/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /finished recent 2/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /backlog newer/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /backlog older/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /finished old/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /backlog oldest/i })).toBeNull();
  });
});
