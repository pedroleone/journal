// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntryViewer } from "@/components/journal/entry-viewer";

vi.mock("@/hooks/use-online-status", () => ({
  useOnlineStatus: () => true,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <button>{children}</button>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => <div className={className}>skeleton</div>,
}));

vi.mock("@/components/journal/journal-entry-state", () => ({
  JournalEntryState: ({ content }: { content: string }) => (
    <div data-testid="journal-entry-state">
      <div className="journal-prose">{content}</div>
    </div>
  ),
}));

describe("EntryViewer layout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders populated browse days without browse metadata labels or framing chrome", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "entry-1",
          source: "web",
          year: 2026,
          month: 3,
          day: 19,
          hour: null,
          content: "Today felt like a turning point.",
          created_at: "2026-03-19T20:00:00.000Z",
          images: ["img-1"],
        },
      ],
    } as Response);

    const { container } = render(<EntryViewer year={2026} month={3} day={19} />);

    expect(await screen.findByText(/today felt like a turning point/i)).toBeTruthy();
    expect(screen.queryByText("Single entry")).toBeNull();
    expect(screen.queryByText("Includes images")).toBeNull();
    expect(screen.queryByText("Web entry")).toBeNull();
    expect(container.querySelector(".journal-browse-shell")).toBeNull();
  });

  it("keeps empty days flat and action-led without framed browse chrome", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    const { container } = render(<EntryViewer year={2026} month={3} day={20} />);

    expect(await screen.findByRole("link", { name: /write for this day/i })).toBeTruthy();
    expect(container.querySelector(".journal-browse-shell")).toBeNull();
    expect(container.querySelector(".journal-browse-footer")).toBeNull();
  });
});
