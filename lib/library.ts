export type MediaType = "book" | "album" | "movie" | "game" | "video" | "misc";
export type MediaStatus = "backlog" | "in_progress" | "finished" | "dropped";
export type BookFormat = "ebook" | "physical" | "audiobook";

export type BookMetadata = {
  year: number | null;
  bookFormat: BookFormat | null;
  totalPages: number | null;
  currentProgressPercent: number | null;
  currentProgressPage: number | null;
  totalDurationMinutes: number | null;
  currentProgressMinutes: number | null;
  progressUpdatedAt: string | null;
};

export type BookProgressMetadata = Pick<
  BookMetadata,
  "bookFormat" | "currentProgressPercent" | "currentProgressPage" | "totalPages" | "totalDurationMinutes" | "currentProgressMinutes"
> & {
  progressUpdatedAt?: string | null;
};

export const MEDIA_TYPES: MediaType[] = ["book", "album", "movie", "game", "video", "misc"];
export const MEDIA_STATUSES: MediaStatus[] = ["backlog", "in_progress", "finished", "dropped"];

export const DEFAULT_REACTIONS = [
  "interesting",
  "beautiful",
  "disturbing",
  "funny",
  "thought-provoking",
  "virtuoso",
  "cozy",
  "intense",
  "overrated",
  "underrated",
];

function createEmptyBookMetadata(): BookMetadata {
  return {
    year: null,
    bookFormat: null,
    totalPages: null,
    currentProgressPercent: null,
    currentProgressPage: null,
    totalDurationMinutes: null,
    currentProgressMinutes: null,
    progressUpdatedAt: null,
  };
}

function normalizeBookFormat(value: unknown): BookFormat | null {
  return value === "ebook" || value === "physical" || value === "audiobook" ? value : null;
}

function normalizeYear(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value)
    ? value
    : null;
}

function normalizeNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function normalizeProgressPercent(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}

function normalizeProgressUpdatedAt(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

export function clearIncompatibleBookProgressSnapshot(metadata: BookMetadata): BookMetadata {
  if (metadata.bookFormat === "ebook") {
    const didClearProgress = metadata.totalPages !== null || metadata.currentProgressPage !== null
      || metadata.totalDurationMinutes !== null || metadata.currentProgressMinutes !== null;
    return {
      ...metadata,
      totalPages: null,
      currentProgressPage: null,
      totalDurationMinutes: null,
      currentProgressMinutes: null,
      progressUpdatedAt: didClearProgress ? null : metadata.progressUpdatedAt,
    };
  }

  if (metadata.bookFormat === "physical") {
    const didClearProgress = metadata.currentProgressPercent !== null
      || metadata.totalDurationMinutes !== null || metadata.currentProgressMinutes !== null;
    return {
      ...metadata,
      currentProgressPercent: null,
      totalDurationMinutes: null,
      currentProgressMinutes: null,
      progressUpdatedAt: didClearProgress ? null : metadata.progressUpdatedAt,
    };
  }

  if (metadata.bookFormat === "audiobook") {
    const didClearProgress = metadata.totalPages !== null || metadata.currentProgressPage !== null
      || metadata.currentProgressPercent !== null;
    return {
      ...metadata,
      totalPages: null,
      currentProgressPage: null,
      currentProgressPercent: null,
      progressUpdatedAt: didClearProgress ? null : metadata.progressUpdatedAt,
    };
  }

  const didClearProgress = (
    metadata.totalPages !== null
    || metadata.currentProgressPercent !== null
    || metadata.currentProgressPage !== null
    || metadata.totalDurationMinutes !== null
    || metadata.currentProgressMinutes !== null
  );

  return {
    ...metadata,
    totalPages: null,
    currentProgressPercent: null,
    currentProgressPage: null,
    totalDurationMinutes: null,
    currentProgressMinutes: null,
    progressUpdatedAt: didClearProgress ? null : metadata.progressUpdatedAt,
  };
}

export function clearOutOfRangeBookPageSnapshot(metadata: BookMetadata): BookMetadata {
  if (metadata.bookFormat === "physical") {
    if (
      metadata.totalPages === null
      || metadata.currentProgressPage === null
      || metadata.currentProgressPage <= metadata.totalPages
    ) {
      return metadata;
    }
    return {
      ...metadata,
      currentProgressPage: null,
      progressUpdatedAt: null,
    };
  }

  if (metadata.bookFormat === "audiobook") {
    if (
      metadata.totalDurationMinutes === null
      || metadata.currentProgressMinutes === null
      || metadata.currentProgressMinutes <= metadata.totalDurationMinutes
    ) {
      return metadata;
    }
    return {
      ...metadata,
      currentProgressMinutes: null,
      progressUpdatedAt: null,
    };
  }

  return metadata;
}

export function normalizeBookMetadata(value: unknown): BookMetadata {
  if (!value || typeof value !== "object") {
    return createEmptyBookMetadata();
  }

  const record = value as Record<string, unknown>;

  return clearOutOfRangeBookPageSnapshot(
    clearIncompatibleBookProgressSnapshot({
      year: normalizeYear(record.year),
      bookFormat: normalizeBookFormat(record.bookFormat),
      totalPages: normalizeNullableNumber(record.totalPages),
      currentProgressPercent: normalizeProgressPercent(record.currentProgressPercent),
      currentProgressPage: normalizeNullableNumber(record.currentProgressPage),
      totalDurationMinutes: normalizeNullableNumber(record.totalDurationMinutes),
      currentProgressMinutes: normalizeNullableNumber(record.currentProgressMinutes),
      progressUpdatedAt: normalizeProgressUpdatedAt(record.progressUpdatedAt),
    }),
  );
}

export function deriveBookProgressPercent(
  metadata: Pick<BookMetadata, "bookFormat" | "currentProgressPage" | "totalPages" | "totalDurationMinutes" | "currentProgressMinutes">,
): number | null {
  if (metadata.bookFormat === "physical") {
    if (
      metadata.currentProgressPage === null ||
      metadata.totalPages === null ||
      metadata.totalPages <= 0 ||
      metadata.currentProgressPage > metadata.totalPages
    ) {
      return null;
    }
    return Math.round((metadata.currentProgressPage / metadata.totalPages) * 100);
  }

  if (metadata.bookFormat === "audiobook") {
    if (
      metadata.currentProgressMinutes === null ||
      metadata.totalDurationMinutes === null ||
      metadata.totalDurationMinutes <= 0 ||
      metadata.currentProgressMinutes > metadata.totalDurationMinutes
    ) {
      return null;
    }
    return Math.round((metadata.currentProgressMinutes / metadata.totalDurationMinutes) * 100);
  }

  return null;
}

export function getBookProgressPercent(metadata: BookProgressMetadata | null | undefined): number | null {
  if (!metadata || metadata.bookFormat === null) {
    return null;
  }

  if (metadata.bookFormat === "ebook") {
    if (metadata.currentProgressPercent === null || metadata.currentProgressPercent < 0 || metadata.currentProgressPercent > 100) {
      return null;
    }

    return metadata.currentProgressPercent;
  }

  return deriveBookProgressPercent(metadata);
}

export function formatMinutesAsTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function parseTimeToMinutes(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try "XXh YYmin" or "XXh YYm" or "XXhYYmin" or "XXhYYm"
  const fullMatch = trimmed.match(/^(\d+)\s*h\s*(\d+)\s*m(?:in)?$/i);
  if (fullMatch) {
    return parseInt(fullMatch[1], 10) * 60 + parseInt(fullMatch[2], 10);
  }

  // Try "XXh"
  const hoursOnly = trimmed.match(/^(\d+)\s*h$/i);
  if (hoursOnly) {
    return parseInt(hoursOnly[1], 10) * 60;
  }

  // Try "YYmin" or "YYm"
  const minsOnly = trimmed.match(/^(\d+)\s*m(?:in)?$/i);
  if (minsOnly) {
    return parseInt(minsOnly[1], 10);
  }

  return null;
}

export function isBookProgressComplete(
  metadata: Pick<BookMetadata, "bookFormat" | "currentProgressPercent" | "currentProgressPage" | "totalPages" | "totalDurationMinutes" | "currentProgressMinutes">,
): boolean {
  if (metadata.bookFormat === "ebook") {
    return metadata.currentProgressPercent !== null && metadata.currentProgressPercent >= 100;
  }

  if (metadata.bookFormat === "physical") {
    return (
      metadata.currentProgressPage !== null &&
      metadata.totalPages !== null &&
      metadata.currentProgressPage >= metadata.totalPages
    );
  }

  if (metadata.bookFormat === "audiobook") {
    return (
      metadata.currentProgressMinutes !== null &&
      metadata.totalDurationMinutes !== null &&
      metadata.currentProgressMinutes >= metadata.totalDurationMinutes
    );
  }

  return false;
}

export function shouldShowBookCompletionCue({
  status,
  previous,
  next,
}: {
  status: MediaStatus;
  previous: Pick<BookMetadata, "bookFormat" | "currentProgressPercent" | "currentProgressPage" | "totalPages" | "totalDurationMinutes" | "currentProgressMinutes">;
  next: Pick<BookMetadata, "bookFormat" | "currentProgressPercent" | "currentProgressPage" | "totalPages" | "totalDurationMinutes" | "currentProgressMinutes">;
}): boolean {
  if (status === "finished") {
    return false;
  }

  return !isBookProgressComplete(previous) && isBookProgressComplete(next);
}

/**
 * Compute timestamp changes when a media item's status changes.
 * `in_progress` → set `started_at` if null.
 * `finished` → set `finished_at` always + `started_at` if null.
 * `backlog`/`dropped` → no changes.
 */
export function computeStatusTimestamps(
  newStatus: MediaStatus,
  current: { started_at: string | null; finished_at: string | null },
  now?: string,
): { started_at?: string; finished_at?: string } {
  const ts = now ?? new Date().toISOString();
  const result: { started_at?: string; finished_at?: string } = {};

  if (newStatus === "in_progress") {
    if (!current.started_at) result.started_at = ts;
  } else if (newStatus === "finished") {
    if (!current.started_at) result.started_at = ts;
    result.finished_at = ts;
  }

  return result;
}

export const CREATOR_LABELS: Record<MediaType, string> = {
  book: "Author",
  album: "Artist",
  movie: "Director",
  game: "Developer",
  video: "Channel",
  misc: "Creator",
};
