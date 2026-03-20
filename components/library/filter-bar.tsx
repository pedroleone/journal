"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import type { MediaStatus, MediaType } from "@/lib/library";
import { MEDIA_STATUSES, MEDIA_TYPES } from "@/lib/library";

export interface LibraryFilters {
  type: MediaType | null;
  status: MediaStatus | null;
  genre: string | null;
  reaction: string | null;
  platform: string | null;
  rating: number | null;
  search: string | null;
}

export const EMPTY_FILTERS: LibraryFilters = {
  type: null,
  status: null,
  genre: null,
  reaction: null,
  platform: null,
  rating: null,
  search: null,
};

interface VocabEntry {
  value: string;
  count: number;
}

interface FilterBarProps {
  filters: LibraryFilters;
  onFilterChange: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void;
  genres: VocabEntry[];
  reactions: VocabEntry[];
  platforms: VocabEntry[];
}

const STATUS_COLORS: Record<MediaStatus, string> = {
  backlog: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  finished: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dropped: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function FilterBar({ filters, onFilterChange, genres, reactions, platforms }: FilterBarProps) {
  const { t } = useLocale();
  const typeLabels: Record<MediaType, string> = {
    book: t.library.book,
    album: t.library.album,
    movie: t.library.movie,
    game: t.library.game,
    video: t.library.video,
    misc: t.library.misc,
  };

  const statusLabels: Record<MediaStatus, string> = {
    backlog: t.library.backlog,
    in_progress: t.library.inProgress,
    finished: t.library.finished,
    dropped: t.library.dropped,
  };

  const showPlatform = !filters.type || filters.type === "game";

  const activeChips: { label: string; key: keyof LibraryFilters }[] = [];
  if (filters.type) activeChips.push({ label: typeLabels[filters.type], key: "type" });
  if (filters.status) activeChips.push({ label: statusLabels[filters.status], key: "status" });
  if (filters.genre) activeChips.push({ label: filters.genre, key: "genre" });
  if (filters.reaction) activeChips.push({ label: filters.reaction, key: "reaction" });
  if (filters.platform) activeChips.push({ label: filters.platform, key: "platform" });
  if (filters.rating) activeChips.push({ label: t.library.ratingAndAbove(filters.rating), key: "rating" });

  return (
    <div className="space-y-2 border-b border-border/60 px-3 py-2">
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onFilterChange("type", null)}
          className={cn(
            "rounded-md px-2 py-1 text-xs transition-colors",
            !filters.type
              ? "bg-secondary font-medium text-foreground"
              : "text-muted-foreground hover:bg-secondary/50",
          )}
        >
          {t.library.all}
        </button>
        {MEDIA_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onFilterChange("type", filters.type === type ? null : type)}
            className={cn(
              "rounded-md px-2 py-1 text-xs transition-colors",
              filters.type === type
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/50",
            )}
          >
            {typeLabels[type]}
          </button>
        ))}
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => onFilterChange("status", null)}
          className={cn(
            "rounded-md px-2 py-1 text-xs transition-colors",
            !filters.status
              ? "bg-secondary font-medium text-foreground"
              : "text-muted-foreground hover:bg-secondary/50",
          )}
        >
          {t.library.allStatuses}
        </button>
        {MEDIA_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onFilterChange("status", filters.status === s ? null : s)}
            className={cn(
              "rounded-md px-2 py-1 text-xs transition-colors",
              filters.status === s
                ? STATUS_COLORS[s] + " font-medium"
                : "text-muted-foreground hover:bg-secondary/50",
            )}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Dropdowns row */}
      <div className="flex flex-wrap gap-2">
        {/* Genre dropdown */}
        {genres.length > 0 && (
          <select
            value={filters.genre ?? ""}
            onChange={(e) => onFilterChange("genre", e.target.value || null)}
            className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
          >
            <option value="">{t.library.allGenres}</option>
            {genres.map((g) => (
              <option key={g.value} value={g.value}>
                {g.value} ({g.count})
              </option>
            ))}
          </select>
        )}

        {/* Reaction dropdown */}
        {reactions.length > 0 && (
          <select
            value={filters.reaction ?? ""}
            onChange={(e) => onFilterChange("reaction", e.target.value || null)}
            className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
          >
            <option value="">{t.library.allReactions}</option>
            {reactions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.value} ({r.count})
              </option>
            ))}
          </select>
        )}

        {/* Platform dropdown */}
        {showPlatform && platforms.length > 0 && (
          <select
            value={filters.platform ?? ""}
            onChange={(e) => onFilterChange("platform", e.target.value || null)}
            className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
          >
            <option value="">{t.library.allPlatforms}</option>
            {platforms.map((p) => (
              <option key={p.value} value={p.value}>
                {p.value} ({p.count})
              </option>
            ))}
          </select>
        )}

        {/* Rating selector */}
        <select
          value={filters.rating ?? ""}
          onChange={(e) => onFilterChange("rating", e.target.value ? Number(e.target.value) : null)}
          className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs text-foreground"
        >
          <option value="">{t.library.anyRating}</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} {t.library.ratingAndAbove(n)}
            </option>
          ))}
        </select>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground"
            >
              {chip.label}
              <button
                onClick={() => onFilterChange(chip.key, null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={() => {
              onFilterChange("status", null);
              onFilterChange("genre", null);
              onFilterChange("reaction", null);
              onFilterChange("platform", null);
              onFilterChange("rating", null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t.library.clearFilters}
          </button>
        </div>
      )}
    </div>
  );
}
