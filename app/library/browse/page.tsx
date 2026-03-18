"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LibraryBrowse, type BrowseItem } from "@/components/library/library-browse";
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

  const [items, setItems] = useState<BrowseItem[]>([]);
  const [genres, setGenres] = useState<VocabEntry[]>([]);
  const [reactions, setReactions] = useState<VocabEntry[]>([]);
  const [platforms, setPlatforms] = useState<VocabEntry[]>([]);

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

  // Redirect legacy ?new=1 to /library/new
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      router.replace("/library/new");
    }
  }, [searchParams, router]);

  function setFilter<K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    params.delete("new");
    const qs = params.toString();
    router.replace(qs ? `/library/browse?${qs}` : "/library/browse");
  }

  async function handleQuickAdd(type: MediaType, title: string, creator?: string) {
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, ...(creator && { creator }) }),
    });
    if (!res.ok) return;
    await loadItems(filters);
  }

  return (
    <LibraryBrowse
      items={items}
      filters={filters}
      onFilterChange={setFilter}
      onQuickAdd={handleQuickAdd}
      genres={genres}
      reactions={reactions}
      platforms={platforms}
    />
  );
}
