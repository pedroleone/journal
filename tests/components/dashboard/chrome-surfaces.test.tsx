// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BreadcrumbActionsProvider } from "@/components/dashboard/breadcrumb-actions";
import { TopBar } from "@/components/dashboard/top-bar";
import { BreadcrumbBar } from "@/components/dashboard/breadcrumb-bar";
import { QuadrantCard } from "@/components/dashboard/quadrant-card";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

describe("dashboard chrome surfaces", () => {
  it("uses shared surface tokens for the top navigation bars", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<TopBar />);

    expect(screen.getByRole("banner").className).toContain("bg-[var(--surface-topbar)]");
  });

  it("uses the shared top-bar surface token in the breadcrumb bar", () => {
    render(
      <BreadcrumbActionsProvider>
        <BreadcrumbBar domain="journal" />
      </BreadcrumbActionsProvider>,
    );

    expect(screen.getByRole("banner").className).toContain("bg-[var(--surface-topbar)]");
  });

  it("uses shared surface tokens for quadrant cards", () => {
    const { container } = render(
      <QuadrantCard domain="journal" label="Journal" href="/journal/browse">
        <p>Preview</p>
      </QuadrantCard>,
    );

    expect(container.firstElementChild?.className).toContain("bg-[var(--surface-panel)]");
    expect(container.firstElementChild?.className).toContain(
      "hover:bg-[var(--surface-panel-hover)]",
    );
  });
});
