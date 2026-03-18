"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LibraryList, type LibraryListItem } from "@/components/library/library-list";
import { NEW_ITEM_ID, LibraryViewer } from "@/components/library/library-viewer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { useLocale } from "@/hooks/use-locale";
import type { LibraryFilters } from "@/components/library/filter-bar";
import type { MediaType, MediaStatus } from "@/lib/library";

interface VocabEntry {
  value: string;
  count: number;
}

function filtersFromParams(params: URLSearchParams): LibraryFilters {
  return {
    type: (params.get("type") as MediaType) || null,
    status: (params.get("status") as MediaStatus) || null,
    genre: params.get("genre") || null,
    reaction: params.get("reaction") || null,
    platform: params.get("platform") || null,
    rating: params.get("rating") ? Number(params.get("rating")) : null,
    search: params.get("search") || null,
  };
}

export default function LibraryBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [items, setItems] = useState<LibraryListItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [genres, setGenres] = useState<VocabEntry[]>([]);
  const [reactions, setReactions] = useState<VocabEntry[]>([]);
  const [platforms, setPlatforms] = useState<VocabEntry[]>([]);
  const { t } = useLocale();

  const filters = filtersFromParams(searchParams);

  // Load vocabulary on mount
  useEffect(() => {
    async function fetchVocab(field: string) {
      const res = await fetch(`/api/library/vocabulary?field=${field}`);
      if (!res.ok) return [];
      return res.json();
    }
    Promise.all([fetchVocab("genres"), fetchVocab("reactions"), fetchVocab("platform")]).then(
      ([g, r, p]) => {
        setGenres(g);
        setReactions(r);
        setPlatforms(p);
      },
    );
  }, []);

  const loadItems = useCallback(async (f: LibraryFilters) => {
    const params = new URLSearchParams();
    if (f.type) params.set("type", f.type);
    if (f.status) params.set("status", f.status);
    if (f.genre) params.set("genre", f.genre);
    if (f.reaction) params.set("reaction", f.reaction);
    if (f.platform) params.set("platform", f.platform);
    if (f.rating) params.set("rating", String(f.rating));
    if (f.search) params.set("search", f.search);
    const qs = params.toString();
    const url = qs ? `/api/library?${qs}` : "/api/library";
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    setItems(data);
  }, []);

  useEffect(() => {
    loadItems(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), loadItems]);

  const isNewMode = searchParams.get("new") === "1";

  useEffect(() => {
    if (isNewMode) {
      void handleNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewMode]);

  function setFilter<K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    // Remove "new" param when changing filters
    params.delete("new");
    const qs = params.toString();
    router.replace(qs ? `/library/browse?${qs}` : "/library/browse");
  }

  function handleSelectItem(id: string) {
    if (id === NEW_ITEM_ID) return;
    setSelectedItemId(id);
    if (isMobile) setSidebarOpen(false);
  }

  function handleNew() {
    // Remove "new" from URL but keep filters
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    const qs = params.toString();
    router.replace(qs ? `/library/browse?${qs}` : "/library/browse");
    setSelectedItemId(NEW_ITEM_ID);
    if (isMobile) setSidebarOpen(false);
  }

  async function handleQuickAdd(type: MediaType, title: string) {
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title }),
    });
    if (!res.ok) return;
    const { id } = await res.json();
    await loadItems(filters);
    setSelectedItemId(id);
    if (isMobile) setSidebarOpen(false);
  }

  async function handleBulkStatus(ids: string[], status: MediaStatus) {
    const res = await fetch("/api/library/bulk-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status }),
    });
    if (!res.ok) return;
    await loadItems(filters);
  }

  const showContent = isMobile ? !sidebarOpen : true;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <CollapsibleSidebar visible={sidebarOpen}>
        <LibraryList
          items={items}
          selectedId={selectedItemId}
          filters={filters}
          onSelect={handleSelectItem}
          onFilterChange={setFilter}
          onNew={handleNew}
          onQuickAdd={handleQuickAdd}
          onBulkStatus={handleBulkStatus}
          genres={genres}
          reactions={reactions}
          platforms={platforms}
        />
      </CollapsibleSidebar>

      {showContent && (
        <div className="flex-1 overflow-y-auto scrollbar-gutter-stable">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-6 pt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.library.back}
            </button>
          )}
          <LibraryViewer
            itemId={selectedItemId}
            onDeleted={() => {
              setSelectedItemId(null);
              if (isMobile) setSidebarOpen(true);
            }}
            onCreated={(id) => {
              setSelectedItemId(id);
            }}
            onItemsChanged={() => loadItems(filters)}
          />
        </div>
      )}
    </div>
  );
}
