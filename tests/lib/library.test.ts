import { describe, it, expect } from "vitest";
import {
  clearIncompatibleBookProgressSnapshot,
  clearOutOfRangeBookPageSnapshot,
  computeStatusTimestamps,
  deriveBookProgressPercent,
  getBookProgressPercent,
  isBookProgressComplete,
  normalizeBookMetadata,
  shouldShowBookCompletionCue,
} from "@/lib/library";

const NOW = "2026-03-17T12:00:00.000Z";
const EARLIER = "2026-03-10T08:00:00.000Z";

describe("computeStatusTimestamps", () => {
  it("sets started_at when transitioning to in_progress with no prior started_at", () => {
    const result = computeStatusTimestamps("in_progress", { started_at: null, finished_at: null }, NOW);
    expect(result).toEqual({ started_at: NOW });
  });

  it("does not override existing started_at when transitioning to in_progress", () => {
    const result = computeStatusTimestamps("in_progress", { started_at: EARLIER, finished_at: null }, NOW);
    expect(result).toEqual({});
  });

  it("sets both started_at and finished_at when finishing with no prior started_at", () => {
    const result = computeStatusTimestamps("finished", { started_at: null, finished_at: null }, NOW);
    expect(result).toEqual({ started_at: NOW, finished_at: NOW });
  });

  it("sets finished_at but not started_at when finishing with existing started_at", () => {
    const result = computeStatusTimestamps("finished", { started_at: EARLIER, finished_at: null }, NOW);
    expect(result).toEqual({ finished_at: NOW });
  });

  it("always overwrites finished_at when finishing even if it already exists", () => {
    const result = computeStatusTimestamps("finished", { started_at: EARLIER, finished_at: EARLIER }, NOW);
    expect(result).toEqual({ finished_at: NOW });
  });

  it("returns empty object for backlog status", () => {
    const result = computeStatusTimestamps("backlog", { started_at: EARLIER, finished_at: EARLIER }, NOW);
    expect(result).toEqual({});
  });

  it("returns empty object for dropped status", () => {
    const result = computeStatusTimestamps("dropped", { started_at: EARLIER, finished_at: EARLIER }, NOW);
    expect(result).toEqual({});
  });

  it("uses current time when now is not provided", () => {
    const before = new Date().toISOString();
    const result = computeStatusTimestamps("in_progress", { started_at: null, finished_at: null });
    const after = new Date().toISOString();
    expect(result.started_at).toBeDefined();
    expect(result.started_at! >= before).toBe(true);
    expect(result.started_at! <= after).toBe(true);
  });
});

describe("normalizeBookMetadata", () => {
  it("clears ebook-incompatible snapshot values", () => {
    const result = normalizeBookMetadata({
      bookFormat: "ebook",
      totalPages: 420,
      currentProgressPercent: 65,
      currentProgressPage: 180,
      progressUpdatedAt: NOW,
    });

    expect(result).toEqual({
      year: null,
      bookFormat: "ebook",
      totalPages: null,
      currentProgressPercent: 65,
      currentProgressPage: null,
      progressUpdatedAt: null,
    });
  });

  it("clears physical-incompatible snapshot values", () => {
    const result = normalizeBookMetadata({
      bookFormat: "physical",
      totalPages: 420,
      currentProgressPercent: 65,
      currentProgressPage: 180,
      progressUpdatedAt: NOW,
    });

    expect(result).toEqual({
      year: null,
      bookFormat: "physical",
      totalPages: 420,
      currentProgressPercent: null,
      currentProgressPage: 180,
      progressUpdatedAt: null,
    });
  });

  it("defaults invalid metadata to an empty book snapshot", () => {
    const result = normalizeBookMetadata({
      bookFormat: "audio",
      totalPages: -5,
      currentProgressPercent: 120,
      currentProgressPage: 0,
      progressUpdatedAt: 123,
    });

    expect(result).toEqual({
      year: null,
      bookFormat: null,
      totalPages: null,
      currentProgressPercent: null,
      currentProgressPage: null,
      progressUpdatedAt: null,
    });
  });

  it("normalizes invalid progressUpdatedAt values to null", () => {
    const result = normalizeBookMetadata({
      bookFormat: "ebook",
      currentProgressPercent: 40,
      progressUpdatedAt: "not-a-date",
    });

    expect(result).toEqual({
      year: null,
      bookFormat: "ebook",
      totalPages: null,
      currentProgressPercent: 40,
      currentProgressPage: null,
      progressUpdatedAt: null,
    });
  });

  it("returns a fresh empty object for invalid metadata inputs", () => {
    const first = normalizeBookMetadata(null);
    const second = normalizeBookMetadata(null);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });
});

describe("clearIncompatibleBookProgressSnapshot", () => {
  it("removes page-based snapshot fields for ebooks", () => {
    expect(
      clearIncompatibleBookProgressSnapshot({
        year: null,
        bookFormat: "ebook",
        totalPages: 320,
        currentProgressPercent: 55,
        currentProgressPage: 120,
        progressUpdatedAt: NOW,
      }),
    ).toEqual({
      year: null,
      bookFormat: "ebook",
      totalPages: null,
      currentProgressPercent: 55,
      currentProgressPage: null,
      progressUpdatedAt: null,
    });
  });

  it("removes percent-based snapshot fields for physical books", () => {
    expect(
      clearIncompatibleBookProgressSnapshot({
        year: null,
        bookFormat: "physical",
        totalPages: 320,
        currentProgressPercent: 55,
        currentProgressPage: 120,
        progressUpdatedAt: NOW,
      }),
    ).toEqual({
      year: null,
      bookFormat: "physical",
      totalPages: 320,
      currentProgressPercent: null,
      currentProgressPage: 120,
      progressUpdatedAt: null,
    });
  });
});

describe("clearOutOfRangeBookPageSnapshot", () => {
  it("clears page progress when it exceeds totalPages for a physical book", () => {
    expect(
      clearOutOfRangeBookPageSnapshot({
        year: null,
        bookFormat: "physical",
        totalPages: 200,
        currentProgressPercent: null,
        currentProgressPage: 250,
        progressUpdatedAt: NOW,
      }),
    ).toEqual({
      year: null,
      bookFormat: "physical",
      totalPages: 200,
      currentProgressPercent: null,
      currentProgressPage: null,
      progressUpdatedAt: null,
    });
  });

  it("leaves valid page progress unchanged", () => {
    const metadata = {
      year: null,
      bookFormat: "physical" as const,
      totalPages: 320,
      currentProgressPercent: null,
      currentProgressPage: 120,
      progressUpdatedAt: NOW,
    };

    expect(clearOutOfRangeBookPageSnapshot(metadata)).toEqual(metadata);
  });
});

describe("deriveBookProgressPercent", () => {
  it("derives percent from physical book page progress", () => {
    expect(
      deriveBookProgressPercent({
        bookFormat: "physical",
        currentProgressPage: 125,
        totalPages: 500,
      }),
    ).toBe(25);
  });

  it("returns null when physical page progress exceeds totalPages", () => {
    expect(
      deriveBookProgressPercent({
        bookFormat: "physical",
        currentProgressPage: 501,
        totalPages: 500,
      }),
    ).toBeNull();
  });

  it("returns null when page progress cannot produce a percent", () => {
    expect(
      deriveBookProgressPercent({
        bookFormat: "physical",
        currentProgressPage: 125,
        totalPages: null,
      }),
    ).toBeNull();
  });

  it("rounds fractional page progress to the nearest whole percent", () => {
    expect(
      deriveBookProgressPercent({
        bookFormat: "physical",
        currentProgressPage: 1,
        totalPages: 8,
      }),
    ).toBe(13);
  });
});

describe("getBookProgressPercent", () => {
  it("returns null for invalid ebook percentages", () => {
    expect(
      getBookProgressPercent({
        bookFormat: "ebook",
        currentProgressPercent: 101,
        currentProgressPage: null,
        totalPages: null,
      }),
    ).toBeNull();
  });

  it("returns null for invalid physical progress snapshots", () => {
    expect(
      getBookProgressPercent({
        bookFormat: "physical",
        currentProgressPercent: null,
        currentProgressPage: 501,
        totalPages: 500,
      }),
    ).toBeNull();
  });
});

describe("isBookProgressComplete", () => {
  it("returns true for an ebook at 100 percent", () => {
    expect(
      isBookProgressComplete({
        bookFormat: "ebook",
        currentProgressPercent: 100,
        currentProgressPage: null,
        totalPages: null,
      }),
    ).toBe(true);
  });

  it("returns true for a physical book at the last page", () => {
    expect(
      isBookProgressComplete({
        bookFormat: "physical",
        currentProgressPercent: null,
        currentProgressPage: 420,
        totalPages: 420,
      }),
    ).toBe(true);
  });

  it("returns false when a physical book is not yet at totalPages", () => {
    expect(
      isBookProgressComplete({
        bookFormat: "physical",
        currentProgressPercent: null,
        currentProgressPage: 419,
        totalPages: 420,
      }),
    ).toBe(false);
  });
});

describe("shouldShowBookCompletionCue", () => {
  it("shows a cue when progress becomes complete for an unfinished item", () => {
    expect(
      shouldShowBookCompletionCue({
        status: "in_progress",
        previous: {
          bookFormat: "ebook",
          currentProgressPercent: 99,
          currentProgressPage: null,
          totalPages: null,
        },
        next: {
          bookFormat: "ebook",
          currentProgressPercent: 100,
          currentProgressPage: null,
          totalPages: null,
        },
      }),
    ).toBe(true);
  });

  it("does not show a cue when the item is already finished", () => {
    expect(
      shouldShowBookCompletionCue({
        status: "finished",
        previous: {
          bookFormat: "ebook",
          currentProgressPercent: 99,
          currentProgressPage: null,
          totalPages: null,
        },
        next: {
          bookFormat: "ebook",
          currentProgressPercent: 100,
          currentProgressPage: null,
          totalPages: null,
        },
      }),
    ).toBe(false);
  });

  it("does not show a cue when the next snapshot has no supported book format", () => {
    expect(
      shouldShowBookCompletionCue({
        status: "in_progress",
        previous: {
          bookFormat: "ebook",
          currentProgressPercent: 99,
          currentProgressPage: null,
          totalPages: null,
        },
        next: {
          bookFormat: null,
          currentProgressPercent: null,
          currentProgressPage: null,
          totalPages: null,
        },
      }),
    ).toBe(false);
  });
});
