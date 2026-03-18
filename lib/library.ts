export type MediaType = "book" | "album" | "movie" | "game" | "video" | "misc";
export type MediaStatus = "backlog" | "in_progress" | "finished" | "dropped";

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
