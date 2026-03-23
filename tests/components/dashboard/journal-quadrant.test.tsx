// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JournalQuadrant } from "@/components/dashboard/journal-quadrant";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateParts(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

describe("JournalQuadrant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Continue Writing, last updated metadata, and word count for today when an entry exists", async () => {
    const today = new Date();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: "entry-1",
          content: "Today I wrote five simple words",
          updated_at: today.toISOString(),
          images: [],
        },
      ]),
    }) as typeof fetch;

    render(<JournalQuadrant date={today} />);

    const continueLinks = await screen.findAllByRole("link", { name: /continue writing/i });
    expect(continueLinks[0]?.getAttribute("href")).toBe("/journal/write?entry=entry-1");
    expect(screen.getByText("6 words")).toBeTruthy();
    expect(screen.getByText(/last updated/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /browse entries/i }).getAttribute("href")).toBe(
      `/journal/browse?date=${toDateOnly(today)}`,
    );
    expect(screen.queryByText(/today i wrote five simple words/i)).toBeNull();
  });

  it("shows Write and latest history metadata for today when there is no entry", async () => {
    const today = new Date();
    const prior = shiftDays(today, -3);
    const { year, month, day } = getDateParts(today);

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          { id: "entry-1", year: prior.getFullYear(), month: prior.getMonth() + 1, day: prior.getDate() },
        ]),
      }) as typeof fetch;

    render(<JournalQuadrant date={today} />);

    const writeLinks = await screen.findAllByRole("link", { name: /^write$/i });
    expect(writeLinks[0]?.getAttribute("href")).toBe(`/journal/write?year=${year}&month=${month}&day=${day}`);
    await waitFor(() => {
      expect(screen.getByText("3 days ago")).toBeTruthy();
    });
    expect(screen.getByRole("link", { name: /browse entries/i }).getAttribute("href")).toBe(
      `/journal/browse?date=${toDateOnly(today)}`,
    );
  });

  it("shows Empty journal when there is no selected-day entry and no prior history", async () => {
    const today = new Date();

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      }) as typeof fetch;

    render(<JournalQuadrant date={today} />);

    expect((await screen.findAllByRole("link", { name: /^write$/i })).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByText(/empty journal/i)).toBeTruthy();
    });
  });

  it("shows status only and browse access for a non-today selected day with an entry", async () => {
    const nonToday = shiftDays(new Date(), -1);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: "entry-1",
          content: "Existing entry",
          updated_at: nonToday.toISOString(),
          images: [],
        },
      ]),
    }) as typeof fetch;

    render(<JournalQuadrant date={nonToday} />);

    expect(await screen.findByText(/entry available/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /journal/i }).getAttribute("href")).toBe(
      `/journal/browse?date=${toDateOnly(nonToday)}`,
    );
    expect(screen.queryByRole("link", { name: /continue writing/i })).toBeNull();
    expect(screen.queryByText(/\bwords\b/i)).toBeNull();
  });

  it("shows status only for a non-today selected day without an entry", async () => {
    const nonToday = shiftDays(new Date(), -1);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    }) as typeof fetch;

    render(<JournalQuadrant date={nonToday} />);

    await waitFor(() => {
      expect(screen.getByText(/no entry for this day/i)).toBeTruthy();
    });
    expect(screen.queryByRole("link", { name: /^write$/i })).toBeNull();
    expect(screen.getByRole("link", { name: /browse entries/i }).getAttribute("href")).toBe(
      `/journal/browse?date=${toDateOnly(nonToday)}`,
    );
  });
});
