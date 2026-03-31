import { describe, it, expect } from "vitest";
import {
  clearIncompatibleBookProgressSnapshot,
  clearOutOfRangeBookPageSnapshot,
  computeStatusTimestamps,
  deriveBookProgressPercent,
  formatMinutesAsTime,
  getBookProgressPercent,
  isBookProgressComplete,
  normalizeBookMetadata,
  parseTimeToMinutes,
  shouldShowBookCompletionCue,
} from "@/lib/library";
import type { BookMetadata } from "@/lib/library";

const NOW = "2026-03-17T12:00:00.000Z";
const EARLIER = "2026-03-10T08:00:00.000Z";

function bookMeta(overrides: Partial<BookMetadata>): BookMetadata {
  return {
    year: null,
    bookFormat: null,
    totalPages: null,
    currentProgressPercent: null,
    currentProgressPage: null,
    totalDurationMinutes: null,
    currentProgressMinutes: null,
    progressUpdatedAt: null,
    ...overrides,
  };
}

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

    expect(result).toEqual(bookMeta({
      bookFormat: "ebook",
      currentProgressPercent: 65,
      progressUpdatedAt: null,
    }));
  });

  it("clears physical-incompatible snapshot values", () => {
    const result = normalizeBookMetadata({
      bookFormat: "physical",
      totalPages: 420,
      currentProgressPercent: 65,
      currentProgressPage: 180,
      progressUpdatedAt: NOW,
    });

    expect(result).toEqual(bookMeta({
      bookFormat: "physical",
      totalPages: 420,
      currentProgressPage: 180,
      progressUpdatedAt: null,
    }));
  });

  it("clears audiobook-incompatible snapshot values", () => {
    const result = normalizeBookMetadata({
      bookFormat: "audiobook",
      totalPages: 420,
      currentProgressPercent: 65,
      currentProgressPage: 180,
      totalDurationMinutes: 720,
      currentProgressMinutes: 300,
      progressUpdatedAt: NOW,
    });

    expect(result).toEqual(bookMeta({
      bookFormat: "audiobook",
      totalDurationMinutes: 720,
      currentProgressMinutes: 300,
      progressUpdatedAt: null,
    }));
  });

  it("defaults invalid metadata to an empty book snapshot", () => {
    const result = normalizeBookMetadata({
      bookFormat: "invalid_format",
      totalPages: -5,
      currentProgressPercent: 120,
      currentProgressPage: 0,
      progressUpdatedAt: 123,
    });

    expect(result).toEqual(bookMeta({}));
  });

  it("normalizes invalid progressUpdatedAt values to null", () => {
    const result = normalizeBookMetadata({
      bookFormat: "ebook",
      currentProgressPercent: 40,
      progressUpdatedAt: "not-a-date",
    });

    expect(result).toEqual(bookMeta({
      bookFormat: "ebook",
      currentProgressPercent: 40,
    }));
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
      clearIncompatibleBookProgressSnapshot(bookMeta({
        bookFormat: "ebook",
        totalPages: 320,
        currentProgressPercent: 55,
        currentProgressPage: 120,
        progressUpdatedAt: NOW,
      })),
    ).toEqual(bookMeta({
      bookFormat: "ebook",
      currentProgressPercent: 55,
      progressUpdatedAt: null,
    }));
  });

  it("removes percent-based snapshot fields for physical books", () => {
    expect(
      clearIncompatibleBookProgressSnapshot(bookMeta({
        bookFormat: "physical",
        totalPages: 320,
        currentProgressPercent: 55,
        currentProgressPage: 120,
        progressUpdatedAt: NOW,
      })),
    ).toEqual(bookMeta({
      bookFormat: "physical",
      totalPages: 320,
      currentProgressPage: 120,
      progressUpdatedAt: null,
    }));
  });

  it("removes page and percent fields for audiobooks", () => {
    expect(
      clearIncompatibleBookProgressSnapshot(bookMeta({
        bookFormat: "audiobook",
        totalPages: 320,
        currentProgressPercent: 55,
        currentProgressPage: 120,
        totalDurationMinutes: 720,
        currentProgressMinutes: 300,
        progressUpdatedAt: NOW,
      })),
    ).toEqual(bookMeta({
      bookFormat: "audiobook",
      totalDurationMinutes: 720,
      currentProgressMinutes: 300,
      progressUpdatedAt: null,
    }));
  });
});

describe("clearOutOfRangeBookPageSnapshot", () => {
  it("clears page progress when it exceeds totalPages for a physical book", () => {
    expect(
      clearOutOfRangeBookPageSnapshot(bookMeta({
        bookFormat: "physical",
        totalPages: 200,
        currentProgressPage: 250,
        progressUpdatedAt: NOW,
      })),
    ).toEqual(bookMeta({
      bookFormat: "physical",
      totalPages: 200,
      progressUpdatedAt: null,
    }));
  });

  it("leaves valid page progress unchanged", () => {
    const metadata = bookMeta({
      bookFormat: "physical",
      totalPages: 320,
      currentProgressPage: 120,
      progressUpdatedAt: NOW,
    });

    expect(clearOutOfRangeBookPageSnapshot(metadata)).toEqual(metadata);
  });

  it("clears audiobook progress when it exceeds totalDurationMinutes", () => {
    expect(
      clearOutOfRangeBookPageSnapshot(bookMeta({
        bookFormat: "audiobook",
        totalDurationMinutes: 600,
        currentProgressMinutes: 700,
        progressUpdatedAt: NOW,
      })),
    ).toEqual(bookMeta({
      bookFormat: "audiobook",
      totalDurationMinutes: 600,
      progressUpdatedAt: null,
    }));
  });

  it("leaves valid audiobook progress unchanged", () => {
    const metadata = bookMeta({
      bookFormat: "audiobook",
      totalDurationMinutes: 720,
      currentProgressMinutes: 300,
      progressUpdatedAt: NOW,
    });

    expect(clearOutOfRangeBookPageSnapshot(metadata)).toEqual(metadata);
  });
});

describe("deriveBookProgressPercent", () => {
  it("derives percent from physical book page progress", () => {
    expect(
      deriveBookProgressPercent(bookMeta({
        bookFormat: "physical",
        currentProgressPage: 125,
        totalPages: 500,
      })),
    ).toBe(25);
  });

  it("returns null when physical page progress exceeds totalPages", () => {
    expect(
      deriveBookProgressPercent(bookMeta({
        bookFormat: "physical",
        currentProgressPage: 501,
        totalPages: 500,
      })),
    ).toBeNull();
  });

  it("returns null when page progress cannot produce a percent", () => {
    expect(
      deriveBookProgressPercent(bookMeta({
        bookFormat: "physical",
        currentProgressPage: 125,
      })),
    ).toBeNull();
  });

  it("rounds fractional page progress to the nearest whole percent", () => {
    expect(
      deriveBookProgressPercent(bookMeta({
        bookFormat: "physical",
        currentProgressPage: 1,
        totalPages: 8,
      })),
    ).toBe(13);
  });

  it("derives percent from audiobook time progress", () => {
    expect(
      deriveBookProgressPercent(bookMeta({
        bookFormat: "audiobook",
        currentProgressMinutes: 360,
        totalDurationMinutes: 720,
      })),
    ).toBe(50);
  });

  it("returns null when audiobook progress exceeds total duration", () => {
    expect(
      deriveBookProgressPercent(bookMeta({
        bookFormat: "audiobook",
        currentProgressMinutes: 800,
        totalDurationMinutes: 720,
      })),
    ).toBeNull();
  });
});

describe("getBookProgressPercent", () => {
  it("returns null for invalid ebook percentages", () => {
    expect(
      getBookProgressPercent(bookMeta({
        bookFormat: "ebook",
        currentProgressPercent: 101,
      })),
    ).toBeNull();
  });

  it("returns null for invalid physical progress snapshots", () => {
    expect(
      getBookProgressPercent(bookMeta({
        bookFormat: "physical",
        currentProgressPage: 501,
        totalPages: 500,
      })),
    ).toBeNull();
  });
});

describe("isBookProgressComplete", () => {
  it("returns true for an ebook at 100 percent", () => {
    expect(
      isBookProgressComplete(bookMeta({
        bookFormat: "ebook",
        currentProgressPercent: 100,
      })),
    ).toBe(true);
  });

  it("returns true for a physical book at the last page", () => {
    expect(
      isBookProgressComplete(bookMeta({
        bookFormat: "physical",
        currentProgressPage: 420,
        totalPages: 420,
      })),
    ).toBe(true);
  });

  it("returns false when a physical book is not yet at totalPages", () => {
    expect(
      isBookProgressComplete(bookMeta({
        bookFormat: "physical",
        currentProgressPage: 419,
        totalPages: 420,
      })),
    ).toBe(false);
  });

  it("returns true for an audiobook at total duration", () => {
    expect(
      isBookProgressComplete(bookMeta({
        bookFormat: "audiobook",
        currentProgressMinutes: 720,
        totalDurationMinutes: 720,
      })),
    ).toBe(true);
  });

  it("returns false when an audiobook is not yet at total duration", () => {
    expect(
      isBookProgressComplete(bookMeta({
        bookFormat: "audiobook",
        currentProgressMinutes: 600,
        totalDurationMinutes: 720,
      })),
    ).toBe(false);
  });
});

describe("shouldShowBookCompletionCue", () => {
  it("shows a cue when progress becomes complete for an unfinished item", () => {
    expect(
      shouldShowBookCompletionCue({
        status: "in_progress",
        previous: bookMeta({
          bookFormat: "ebook",
          currentProgressPercent: 99,
        }),
        next: bookMeta({
          bookFormat: "ebook",
          currentProgressPercent: 100,
        }),
      }),
    ).toBe(true);
  });

  it("does not show a cue when the item is already finished", () => {
    expect(
      shouldShowBookCompletionCue({
        status: "finished",
        previous: bookMeta({
          bookFormat: "ebook",
          currentProgressPercent: 99,
        }),
        next: bookMeta({
          bookFormat: "ebook",
          currentProgressPercent: 100,
        }),
      }),
    ).toBe(false);
  });

  it("does not show a cue when the next snapshot has no supported book format", () => {
    expect(
      shouldShowBookCompletionCue({
        status: "in_progress",
        previous: bookMeta({
          bookFormat: "ebook",
          currentProgressPercent: 99,
        }),
        next: bookMeta({}),
      }),
    ).toBe(false);
  });

  it("shows a cue when audiobook progress becomes complete", () => {
    expect(
      shouldShowBookCompletionCue({
        status: "in_progress",
        previous: bookMeta({
          bookFormat: "audiobook",
          currentProgressMinutes: 600,
          totalDurationMinutes: 720,
        }),
        next: bookMeta({
          bookFormat: "audiobook",
          currentProgressMinutes: 720,
          totalDurationMinutes: 720,
        }),
      }),
    ).toBe(true);
  });
});

describe("formatMinutesAsTime", () => {
  it("formats hours and minutes", () => {
    expect(formatMinutesAsTime(150)).toBe("2h 30min");
  });

  it("formats hours only when minutes is zero", () => {
    expect(formatMinutesAsTime(120)).toBe("2h");
  });

  it("formats minutes only when less than an hour", () => {
    expect(formatMinutesAsTime(45)).toBe("45min");
  });

  it("formats zero minutes", () => {
    expect(formatMinutesAsTime(0)).toBe("0min");
  });
});

describe("parseTimeToMinutes", () => {
  it("parses 'XXh YYmin' format", () => {
    expect(parseTimeToMinutes("2h 30min")).toBe(150);
  });

  it("parses 'XXh YYm' format", () => {
    expect(parseTimeToMinutes("2h 30m")).toBe(150);
  });

  it("parses 'XXh' format", () => {
    expect(parseTimeToMinutes("3h")).toBe(180);
  });

  it("parses 'YYmin' format", () => {
    expect(parseTimeToMinutes("45min")).toBe(45);
  });

  it("parses 'YYm' format", () => {
    expect(parseTimeToMinutes("45m")).toBe(45);
  });

  it("parses without spaces", () => {
    expect(parseTimeToMinutes("2h30min")).toBe(150);
  });

  it("returns null for empty input", () => {
    expect(parseTimeToMinutes("")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseTimeToMinutes("abc")).toBeNull();
  });
});
