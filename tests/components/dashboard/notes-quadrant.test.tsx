// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotesQuadrant } from "@/components/dashboard/notes-quadrant";

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

describe("NotesQuadrant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows browse and new actions and links note rows to the selected browse detail state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      json: async () => [
        {
          id: "n1",
          title: "Trip ideas",
          tags: ["travel"],
        },
      ],
    } as Response);

    render(<NotesQuadrant />);

    expect(
      (await screen.findByRole("link", { name: /browse/i })).getAttribute("href"),
    ).toBe("/notes/browse");
    expect(screen.getByRole("link", { name: /new/i }).getAttribute("href")).toBe(
      "/notes/browse?new=1",
    );
    expect(screen.getByRole("link", { name: /trip ideas/i }).getAttribute("href")).toBe(
      "/notes/browse?id=n1",
    );
  });
});
