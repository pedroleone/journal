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

export const CREATOR_LABELS: Record<MediaType, string> = {
  book: "Author",
  album: "Artist",
  movie: "Director",
  game: "Developer",
  video: "Channel",
  misc: "Creator",
};
