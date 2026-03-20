// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JournalArchivePanel } from "@/components/journal/journal-archive-panel";

vi.mock("@/components/journal/date-tree", () => ({
  DateTree: () => <div data-testid="date-tree">date-tree</div>,
}));

describe("JournalArchivePanel", () => {
  it("renders the archive tree inside a dashboard-styled panel", () => {
    render(
      <JournalArchivePanel
        open
        isMobile={false}
        dates={[{ id: "a", year: 2026, month: 3, day: 7 }]}
        selected={{ year: 2026, month: 3, day: 7 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onExport={vi.fn()}
      />,
    );

    expect(screen.getByTestId("journal-archive-panel")).toBeTruthy();
    expect(screen.getByText("Archive")).toBeTruthy();
    expect(screen.getByTestId("date-tree")).toBeTruthy();
  });
});
