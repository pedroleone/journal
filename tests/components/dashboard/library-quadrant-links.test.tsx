// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
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
    <img alt={alt} className={className} height={height} src={src} width={width} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe("LibraryQuadrant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows browse and add actions and links library rows to dedicated detail pages", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [
          {
            id: "l1",
            title: "Dune",
            creator: "Frank Herbert",
            type: "book",
            status: "in_progress",
            rating: null,
            cover_image: null,
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response);

    render(<LibraryQuadrant />);

    expect(
      (await screen.findByRole("link", { name: /browse/i })).getAttribute("href"),
    ).toBe("/library/browse");
    expect(screen.getByRole("link", { name: /add/i }).getAttribute("href")).toBe(
      "/library/new",
    );
    expect(screen.getByRole("link", { name: /dune/i }).getAttribute("href")).toBe(
      "/library/l1",
    );
  });
});
