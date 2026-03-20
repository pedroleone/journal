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

  it("shows both browse and write actions for the selected day", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([]),
    }) as typeof fetch;

    render(<JournalQuadrant date={new Date("2026-03-20T00:00:00")} />);

    expect(
      (await screen.findByRole("link", { name: /browse/i })).getAttribute("href"),
    ).toBe("/journal/browse?date=2026-03-20");
    expect(screen.getByRole("link", { name: /write/i }).getAttribute("href")).toBe(
      "/journal/write?year=2026&month=3&day=20",
    );
  });

  it("renders preview text and word count from the decrypted entries response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([
        {
          id: "entry-1",
          content: "Today was clear and focused",
          images: ["photo-1.enc", "photo-2.enc"],
        },
      ]),
    }) as typeof fetch;

    render(<JournalQuadrant date={new Date("2026-03-19T00:00:00")} />);

    expect(await screen.findByText(/today was clear and focused/i)).toBeTruthy();
    expect(screen.getByText("5 words")).toBeTruthy();
    expect(screen.getByText("2 images")).toBeTruthy();
  });
});
