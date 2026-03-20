// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JournalQuadrant } from "@/components/dashboard/journal-quadrant";

describe("JournalQuadrant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("links the journal card to browse for the selected day when an entry exists", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([
        { id: "entry-1", encrypted_content: "Existing entry", images: [] },
      ]),
    }) as typeof fetch;

    render(<JournalQuadrant date={new Date("2026-03-19T00:00:00")} />);

    const link = await screen.findByRole("link", { name: /journal/i });
    expect(link.getAttribute("href")).toBe("/journal/browse?date=2026-03-19");
  });

  it("links the journal card to write for the selected day when no entry exists", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([]),
    }) as typeof fetch;

    render(<JournalQuadrant date={new Date("2026-03-20T00:00:00")} />);

    const link = await screen.findByRole("link", { name: /journal/i });
    expect(link.getAttribute("href")).toBe("/journal/write?year=2026&month=3&day=20");
  });
});
