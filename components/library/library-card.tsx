"use client";

import { Star, Book, Disc3, Film, Gamepad2, Video, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { getBookProgressPercent, type BookProgressMetadata, type MediaType, type MediaStatus } from "@/lib/library";

const TYPE_ICONS: Record<MediaType, typeof Book> = {
  book: Book,
  album: Disc3,
  movie: Film,
  game: Gamepad2,
  video: Video,
  misc: Package,
};

const STATUS_COLORS: Record<MediaStatus, string> = {
  backlog: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  finished: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dropped: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TYPE_BG_COLORS: Record<MediaType, string> = {
  book: "bg-amber-50 dark:bg-amber-950/30",
  album: "bg-purple-50 dark:bg-purple-950/30",
  movie: "bg-blue-50 dark:bg-blue-950/30",
  game: "bg-green-50 dark:bg-green-950/30",
  video: "bg-red-50 dark:bg-red-950/30",
  misc: "bg-gray-50 dark:bg-gray-900/30",
};

export interface LibraryCardItem {
  id: string;
  type: MediaType;
  title: string;
  creator: string | null;
  status: MediaStatus;
  rating: number | null;
  cover_image: string | null;
  metadata: BookProgressMetadata | null;
}

interface LibraryCardProps {
  item: LibraryCardItem;
  onClick: (id: string) => void;
}

export function LibraryCard({ item, onClick }: LibraryCardProps) {
  const { t } = useLocale();
  const Icon = TYPE_ICONS[item.type];
  const isAlbum = item.type === "album";
  const progressPercent =
    item.type === "book" && item.status === "in_progress"
      ? getBookProgressPercent(item.metadata)
      : null;

  const statusLabels: Record<MediaStatus, string> = {
    backlog: t.library.backlog,
    in_progress: isAlbum ? t.library.listening : t.library.inProgress,
    finished: isAlbum ? t.library.listened : t.library.finished,
    dropped: t.library.dropped,
  };

  const displayTitle = isAlbum && item.creator
    ? item.title
    : item.title;

  const displayCreator = item.creator;

  return (
    <button
      onClick={() => onClick(item.id)}
      className="group text-left rounded-lg border border-border/50 overflow-hidden transition-all hover:border-border hover:shadow-sm"
    >
      {/* Cover / Placeholder */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {item.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/images/${encodeURIComponent(item.cover_image)}`}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className={cn("flex h-full w-full items-center justify-center", TYPE_BG_COLORS[item.type])}>
            <Icon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Status badge overlay */}
        <span
          className={cn(
            "absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium shadow-sm",
            STATUS_COLORS[item.status],
          )}
        >
          {statusLabels[item.status]}
        </span>
      </div>

      {/* Info */}
      <div className="p-2.5 space-y-0.5">
        <p className="text-sm font-medium leading-tight truncate">{displayTitle}</p>
        {displayCreator && (
          <p className="text-xs text-muted-foreground truncate">{displayCreator}</p>
        )}
        {progressPercent !== null && (
          <p className="text-xs text-muted-foreground truncate">{progressPercent}%</p>
        )}
        {(item.status === "finished" || item.status === "dropped") && item.rating && (
          <div className="flex gap-0.5 pt-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                  "h-3 w-3",
                  n <= item.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
