// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuadrantCard } from "@/components/dashboard/quadrant-card";

describe("QuadrantCard", () => {
  it("does not nest action links inside the primary card link", () => {
    const { container } = render(
      <QuadrantCard
        domain="journal"
        label="Journal"
        href="/journal/browse"
        actions={<a href="/journal/write">Write</a>}
        footer={<span>1 entry</span>}
      >
        <p>Latest entry preview</p>
      </QuadrantCard>,
    );

    expect(screen.getByRole("link", { name: /journal/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /write/i })).toBeTruthy();
    expect(container.querySelector("a a")).toBeNull();
  });

  it("supports linked content rows without nesting them inside the browse surface", () => {
    const { container } = render(
      <QuadrantCard
        domain="notes"
        label="Notes"
        href="/notes/browse"
      >
        <a href="/notes/browse?id=note-1">First note</a>
      </QuadrantCard>,
    );

    const noteLink = screen.getByRole("link", { name: /first note/i });
    expect(noteLink.getAttribute("href")).toBe("/notes/browse?id=note-1");
    expect(container.querySelector("a a")).toBeNull();
  });
});
