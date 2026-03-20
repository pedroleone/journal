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
});
