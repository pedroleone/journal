// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useRegisterBreadcrumbActions } from "@/components/dashboard/breadcrumb-actions";

vi.mock("next/navigation", () => ({
  usePathname: () => "/library/browse",
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

function ActionProbe() {
  useRegisterBreadcrumbActions(
    <button type="button" aria-label="Filters">
      Filters
    </button>,
  );

  return <div>Body</div>;
}

describe("DashboardShell", () => {
  it("renders breadcrumb actions supplied by a child page", () => {
    render(
      <DashboardShell>
        <ActionProbe />
      </DashboardShell>,
    );

    expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
  });

  it("keeps the breadcrumb layout unchanged when no actions are registered", () => {
    render(
      <DashboardShell>
        <div>Body</div>
      </DashboardShell>,
    );

    expect(screen.queryByRole("button", { name: "Filters" })).toBeNull();
    expect(screen.getByText("Library")).toBeTruthy();
  });
});
