"use client";

import { Book, Disc3, Film, Gamepad2, Video, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { MEDIA_TYPES } from "@/lib/library";
import type { MediaType } from "@/lib/library";

const TYPE_ICONS: Record<MediaType, typeof Book> = {
  book: Book,
  album: Disc3,
  movie: Film,
  game: Gamepad2,
  video: Video,
  misc: Package,
};

interface LibraryTypePickerProps {
  onSelect: (type: MediaType) => void;
}

export function LibraryTypePicker({ onSelect }: LibraryTypePickerProps) {
  const { t } = useLocale();

  const typeLabels: Record<MediaType, string> = {
    book: t.library.book,
    album: t.library.album,
    movie: t.library.movie,
    game: t.library.game,
    video: t.library.video,
    misc: t.library.misc,
  };

  return (
    <div className="flex h-full items-center justify-center px-8">
      <div className="w-full max-w-lg">
        <p className="mb-8 text-center text-sm text-muted-foreground/60 uppercase tracking-widest font-medium">
          {t.library.selectType}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {MEDIA_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type];
            return (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-xl border border-border/60 p-6",
                  "text-muted-foreground transition-all hover:border-border hover:bg-secondary/60 hover:text-foreground",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{typeLabels[type]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
