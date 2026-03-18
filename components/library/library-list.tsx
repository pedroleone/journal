"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Book, Disc3, Film, Gamepad2, Video, Package, Plus, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { FilterBar, type LibraryFilters } from "@/components/library/filter-bar";
import { MEDIA_TYPES, MEDIA_STATUSES } from "@/lib/library";
import type { MediaType, MediaStatus } from "@/lib/library";

export interface LibraryListItem {
  id: string;
  type: MediaType;
  title: string;
  creator: string | null;
  status: MediaStatus;
  rating: number | null;
  updated_at: string;
}

interface VocabEntry {
  value: string;
  count: number;
}

interface LibraryListProps {
  items: LibraryListItem[];
  selectedId: string | null;
  filters: LibraryFilters;
  onSelect: (id: string) => void;
  onFilterChange: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void;
  onNew: () => void;
  onQuickAdd?: (type: MediaType, title: string) => Promise<void>;
  onBulkStatus?: (ids: string[], status: MediaStatus) => Promise<void>;
  genres: VocabEntry[];
  reactions: VocabEntry[];
  platforms: VocabEntry[];
}

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function LibraryList({ items, selectedId, filters, onSelect, onFilterChange, onNew, onQuickAdd, onBulkStatus, genres, reactions, platforms }: LibraryListProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<MediaType>("book");
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<MediaStatus>("finished");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const quickAddInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  const types: (MediaType | null)[] = [null, "book", "album", "movie", "game", "video", "misc"];
  const typeLabels: Record<string, string> = {
    "": t.library.all,
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

  // Sync external search filter to input (e.g. on URL change)
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

  async function handleQuickAddSubmit() {
    if (!quickAddTitle.trim() || !onQuickAdd || quickAddSubmitting) return;
    setQuickAddSubmitting(true);
    try {
      await onQuickAdd(quickAddType, quickAddTitle.trim());
      setQuickAddTitle("");
      // Stay open for batch adds, refocus input
      setTimeout(() => quickAddInputRef.current?.focus(), 0);
    } finally {
      setQuickAddSubmitting(false);
    }
  }

  function handleQuickAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") void handleQuickAddSubmit();
    if (e.key === "Escape") { setQuickAddOpen(false); setQuickAddTitle(""); }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  async function handleBulkStatusUpdate() {
    if (!onBulkStatus || selectedIds.size === 0 || bulkUpdating) return;
    setBulkUpdating(true);
    try {
      await onBulkStatus(Array.from(selectedIds), bulkStatus);
      setSelectedIds(new Set());
      setSelectMode(false);
    } finally {
      setBulkUpdating(false);
    }
  }

  const hasActiveFilters = filters.status || filters.genre || filters.reaction || filters.platform || filters.rating;

  return (
    <div className="flex h-full flex-col">
      <div className="relative border-b border-border/60 px-3 py-2 flex items-center gap-1">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          className="w-full bg-transparent pl-6 pr-6 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
          placeholder={t.library.search}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {searchInput && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {onBulkStatus && (
          <button
            onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
            className={cn(
              "shrink-0 p-1 rounded transition-colors",
              selectMode ? "text-foreground bg-secondary" : "text-muted-foreground/50 hover:text-muted-foreground",
            )}
            title={t.library.select}
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/60 px-3 py-2">
        {types.map((type) => (
          <button
            key={type ?? "all"}
            onClick={() => onFilterChange("type", type)}
            className={cn(
              "rounded-md px-2 py-1 text-xs transition-colors",
              filters.type === type
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/50",
            )}
          >
            {typeLabels[type ?? ""]}
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

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {hasActiveFilters || filters.search ? t.library.noItemsForFilters : t.library.empty}
          </p>
        ) : (
          items.map((item) => {
            const Icon = TYPE_ICONS[item.type];
            return (
              <button
                key={item.id}
                onClick={() => selectMode ? toggleSelected(item.id) : onSelect(item.id)}
                className={cn(
                  "w-full border-b border-border/40 px-3 py-3 text-left transition-colors",
                  selectedId === item.id && !selectMode
                    ? "bg-secondary"
                    : "hover:bg-secondary/50",
                  selectMode && selectedIds.has(item.id) && "bg-blue-50 dark:bg-blue-900/20",
                )}
              >
                <div className="flex items-center gap-2">
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 shrink-0 rounded border-border accent-blue-600"
                    />
                  )}
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className={cn("truncate text-sm", selectedId === item.id && !selectMode ? "font-medium" : "")}>
                    {item.title}
                  </p>
                </div>
                <div className={cn("mt-0.5 flex items-center gap-1.5 flex-wrap", selectMode ? "pl-9" : "pl-5.5")}>
                  {item.creator && (
                    <span className="text-xs text-muted-foreground">{item.creator}</span>
                  )}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", STATUS_COLORS[item.status])}>
                    {statusLabels[item.status]}
                  </span>
                  {item.rating && (
                    <span className="text-xs text-muted-foreground">
                      {"★".repeat(item.rating)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDate(item.updated_at)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Select mode action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="border-t border-border/60 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <button onClick={toggleSelectAll} className="text-xs text-muted-foreground hover:text-foreground">
              {selectedIds.size === items.length ? t.library.selectAll : t.library.selectAll}
            </button>
            <span className="text-xs text-muted-foreground">{t.library.nSelected(selectedIds.size)}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="flex-1 bg-transparent border border-border/60 rounded-md px-2 py-1 text-xs focus:outline-none"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as MediaStatus)}
            >
              {MEDIA_STATUSES.map((ms) => (
                <option key={ms} value={ms}>{statusLabels[ms]}</option>
              ))}
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={bulkUpdating}
              className="rounded-md bg-foreground text-background px-3 py-1 text-xs font-medium disabled:opacity-40 hover:opacity-80 transition-opacity"
            >
              {bulkUpdating ? t.library.saving : t.library.updateStatus}
            </button>
          </div>
        </div>
      )}

      {/* Footer: quick add + new item */}
      {!selectMode && (
        <div className="border-t border-border/60 p-3 space-y-2">
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
              </div>
              <div className="flex gap-2">
                <input
                  ref={quickAddInputRef}
                  className="flex-1 bg-transparent border border-border/60 rounded-md px-2 py-1 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                  placeholder={t.library.titlePlaceholder}
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  onKeyDown={handleQuickAddKeyDown}
                  autoFocus
                />
                <button
                  onClick={handleQuickAddSubmit}
                  disabled={quickAddSubmitting || !quickAddTitle.trim()}
                  className="rounded-md bg-foreground text-background px-3 py-1 text-xs font-medium disabled:opacity-40 hover:opacity-80 transition-opacity"
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
                  className="flex-1 rounded-md py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50"
                >
                  {t.library.quickAdd}
                </button>
              )}
              <button
                onClick={onNew}
                className={cn(
                  "rounded-md py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/50",
                  onQuickAdd ? "flex-1" : "w-full",
                )}
              >
                {t.library.newItem}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
