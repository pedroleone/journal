"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Plus, Book, Disc3, Film, Gamepad2, Video, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { FilterBar, type LibraryFilters } from "@/components/library/filter-bar";
import { LibraryCard, type LibraryCardItem } from "@/components/library/library-card";
import { MEDIA_TYPES } from "@/lib/library";
import type { MediaType, MediaStatus } from "@/lib/library";

interface VocabEntry {
  value: string;
  count: number;
}

// Extended item with all fields returned by the list API
export interface BrowseItem extends LibraryCardItem {
  url: string | null;
  reactions: string[] | null;
  genres: string[] | null;
  metadata: Record<string, unknown> | null;
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
  onQuickAdd?: (type: MediaType, title: string, creator?: string) => Promise<void>;
  genres: VocabEntry[];
  reactions: VocabEntry[];
  platforms: VocabEntry[];
}

export function LibraryBrowse({
  items,
  filters,
  onFilterChange,
  onQuickAdd,
  genres,
  reactions,
  platforms,
}: LibraryBrowseProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<MediaType>("book");
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddCreator, setQuickAddCreator] = useState("");
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const quickAddInputRef = useRef<HTMLInputElement>(null);

  const typeLabels: Record<MediaType, string> = {
    book: t.library.book,
    album: t.library.album,
    movie: t.library.movie,
    game: t.library.game,
    video: t.library.video,
    misc: t.library.misc,
  };

  useEffect(() => {
    setSearchInput(filters.search ?? "");
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

  async function handleQuickAddSubmit() {
    if (!quickAddTitle.trim() || !onQuickAdd || quickAddSubmitting) return;
    setQuickAddSubmitting(true);
    try {
      await onQuickAdd(quickAddType, quickAddTitle.trim(), quickAddCreator.trim() || undefined);
      setQuickAddTitle("");
      setQuickAddCreator("");
      setTimeout(() => quickAddInputRef.current?.focus(), 0);
    } finally {
      setQuickAddSubmitting(false);
    }
  }

  function handleQuickAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") void handleQuickAddSubmit();
    if (e.key === "Escape") { setQuickAddOpen(false); setQuickAddTitle(""); setQuickAddCreator(""); }
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

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Search bar */}
      <div className="sticky top-14 z-20 bg-background border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              className="w-full bg-secondary/50 rounded-lg pl-10 pr-10 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
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
        </div>

        {/* Type pills + filter bar */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap gap-1 py-2">
            {([null, ...MEDIA_TYPES] as (MediaType | null)[]).map((type) => (
              <button
                key={type ?? "all"}
                onClick={() => onFilterChange("type", type)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  filters.type === type
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50",
                )}
              >
                {type ? typeLabels[type] : t.library.all}
              </button>
            ))}
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

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
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

      {/* Bottom bar: quick add + new */}
      <div className="sticky bottom-0 bg-background border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-3">
          {quickAddOpen ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {MEDIA_TYPES.map((mt) => {
                  const Icon = TYPE_ICONS[mt];
                  return (
                    <button
                      key={mt}
                      onClick={() => setQuickAddType(mt)}
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        quickAddType === mt
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50",
                      )}
                      title={typeLabels[mt]}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
                <button
                  onClick={() => { setQuickAddOpen(false); setQuickAddTitle(""); setQuickAddCreator(""); }}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  {t.library.cancel}
                </button>
              </div>
              <div className="flex gap-2">
                {quickAddType === "album" ? (
                  <>
                    <input
                      ref={quickAddInputRef}
                      className="flex-1 bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                      placeholder={t.library.albumName}
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={handleQuickAddKeyDown}
                      autoFocus
                      autoComplete="off"
                      data-1p-ignore
                    />
                    <input
                      className="flex-1 bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                      placeholder={t.library.artistPlaceholder}
                      value={quickAddCreator}
                      onChange={(e) => setQuickAddCreator(e.target.value)}
                      onKeyDown={handleQuickAddKeyDown}
                      autoComplete="off"
                      data-1p-ignore
                    />
                  </>
                ) : (
                  <input
                    ref={quickAddInputRef}
                    className="flex-1 bg-transparent border border-border/60 rounded-md px-2 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                    placeholder={t.library.titlePlaceholder}
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    onKeyDown={handleQuickAddKeyDown}
                    autoFocus
                    autoComplete="off"
                    data-1p-ignore
                  />
                )}
                <button
                  onClick={handleQuickAddSubmit}
                  disabled={quickAddSubmitting || !quickAddTitle.trim()}
                  className="rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:opacity-80 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {onQuickAdd && (
                <button
                  onClick={() => setQuickAddOpen(true)}
                  className="flex-1 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50"
                >
                  {t.library.quickAdd}
                </button>
              )}
              <button
                onClick={() => router.push("/library/new")}
                className={cn(
                  "rounded-md py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50",
                  onQuickAdd ? "flex-1" : "w-full",
                )}
              >
                {t.library.newItem}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
