// @vitest-environment jsdom

import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    vi.restoreAllMocks();
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
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response);

    const { container } = render(<LibraryQuadrant />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      const image = container.querySelector("img");
      expect(image?.getAttribute("src")).toBe(
        "/api/images/user-1%2Flibrary%2Fitem-1%2Fcover%20image.enc",
      );
    });
  });
});
