// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FoodQuadrant } from "@/components/dashboard/food-quadrant";

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

describe("FoodQuadrant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("links the food quadrant card to the expanded food page", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response)
      .mockResolvedValueOnce({
        json: async () => [],
      } as Response);

    render(<FoodQuadrant date={new Date("2026-03-20T10:00:00.000Z")} />);

    expect((await screen.findByRole("link", { name: /food/i })).getAttribute("href")).toBe(
      "/food",
    );
  });
});
