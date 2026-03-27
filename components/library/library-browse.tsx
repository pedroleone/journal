"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import {
  Search,
  X,
  Plus,
  Book,
  Disc3,
  Film,
  Gamepad2,
  Video,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { useRegisterBreadcrumbActions } from "@/components/dashboard/breadcrumb-actions";
import { FilterBar, type LibraryFilters } from "@/components/library/filter-bar";
import { LibraryCard, type LibraryCardItem } from "@/components/library/library-card";
import { MEDIA_TYPES } from "@/lib/library";
import type { MediaType } from "@/lib/library";

interface VocabEntry {
  value: string;
  count: number;
}

// Extended item with all fields returned by the list API
export interface BrowseItem extends LibraryCardItem {
  url: string | null;
  reactions: string[] | null;
  genres: string[] | null;
  added_at: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_ICONS: Record<MediaType, typeof Book> = {
  book: Book,
  album: Disc3,
  movie: Film,
  game: Gamepad2,
  video: Video,
  misc: Package,
};

interface LibraryBrowseProps {
  items: BrowseItem[];
  filters: LibraryFilters;
  onFilterChange: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void;
  genres: VocabEntry[];
  reactions: VocabEntry[];
  platforms: VocabEntry[];
}

export function LibraryBrowse({
  items,
  filters,
  onFilterChange,
  genres,
  reactions,
  platforms,
}: LibraryBrowseProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const typeLabels: Record<MediaType, string> = {
    book: t.library.book,
    album: t.library.album,
    movie: t.library.movie,
    game: t.library.game,
    video: t.library.video,
    misc: t.library.misc,
  };

  useEffect(() => {
    startTransition(() => {
      setSearchInput(filters.search ?? "");
    });
  }, [filters.search]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange("search", value || null);
    }, 300);
  }

  function handleCardClick(id: string) {
    router.push(`/library/${id}`);
  }

  // Group items by type (only types that have items)
  const grouped = MEDIA_TYPES
    .map((type) => ({
      type,
      items: items.filter((i) => i.type === type),
    }))
    .filter((g) => g.items.length > 0);

  // If a type filter is active, don't group — just show flat grid
  const showGrouped = !filters.type;
  const hasActiveFilters = filters.status || filters.genre || filters.reaction || filters.platform || filters.rating;
  const activeFilterCount = [
    filters.type,
    filters.status,
    filters.genre,
    filters.reaction,
    filters.platform,
    filters.rating,
  ].filter(Boolean).length;

  useRegisterBreadcrumbActions(
    <>
      <button
        type="button"
        aria-label={t.library.filters}
        aria-expanded={filtersOpen}
        aria-controls="library-advanced-filters"
        onClick={() => setFiltersOpen((open) => !open)}
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-border/60 px-2.5 text-xs transition-colors",
          filtersOpen
            ? "bg-secondary font-medium text-foreground"
            : "text-muted-foreground hover:bg-secondary/50",
        )}
      >
        <span>{t.library.filters}</span>
        {activeFilterCount > 0 && (
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-foreground">
            {activeFilterCount}
          </span>
        )}
        {filtersOpen ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        type="button"
        aria-label={t.library.newItem}
        onClick={() => router.push("/library/new")}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
      </button>
    </>,
  );

  return (
    <div className="min-h-full">
      {filtersOpen && (
        <div
          id="library-advanced-filters"
          className="border-b border-border/60 bg-background"
        >
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full rounded-lg bg-secondary/50 py-2.5 pl-10 pr-10 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder={t.library.search}
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoComplete="off"
                data-1p-ignore
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <FilterBar
              filters={filters}
              onFilterChange={onFilterChange}
              genres={genres}
              reactions={reactions}
              platforms={platforms}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            {hasActiveFilters || filters.search ? t.library.noItemsForFilters : t.library.empty}
          </p>
        ) : showGrouped ? (
          <div className="space-y-10">
            {grouped.map(({ type, items: groupItems }) => {
              const Icon = TYPE_ICONS[type];
              return (
                <section key={type}>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium text-foreground">
                      {t.library.nItems(typeLabels[type], groupItems.length)}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {groupItems.map((item) => (
                      <LibraryCard key={item.id} item={item} onClick={handleCardClick} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {items.map((item) => (
              <LibraryCard key={item.id} item={item} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
