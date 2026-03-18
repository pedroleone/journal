"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LibraryList, type LibraryListItem } from "@/components/library/library-list";
import { NEW_ITEM_ID, LibraryViewer } from "@/components/library/library-viewer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { useLocale } from "@/hooks/use-locale";
import type { MediaType } from "@/lib/library";

export default function LibraryBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [items, setItems] = useState<LibraryListItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<MediaType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { t } = useLocale();

  const loadItems = useCallback(async (type?: MediaType | null) => {
    const url = type ? `/api/library?type=${encodeURIComponent(type)}` : "/api/library";
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    setItems(data);
  }, []);

  useEffect(() => {
    loadItems(activeType);
  }, [activeType, loadItems]);

  const isNewMode = searchParams.get("new") === "1";

  useEffect(() => {
    if (isNewMode) {
      void handleNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewMode]);

  function handleSelectItem(id: string) {
    if (id === NEW_ITEM_ID) return;
    setSelectedItemId(id);
    if (isMobile) setSidebarOpen(false);
    if (searchParams.get("new")) router.replace("/library/browse");
  }

  function handleTypeFilter(type: MediaType | null) {
    setActiveType(type);
  }

  function handleNew() {
    router.replace("/library/browse");
    setSelectedItemId(NEW_ITEM_ID);
    if (isMobile) setSidebarOpen(false);
  }

  const showContent = isMobile ? !sidebarOpen : true;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <CollapsibleSidebar visible={sidebarOpen}>
        <LibraryList
          items={items}
          selectedId={selectedItemId}
          activeType={activeType}
          onSelect={handleSelectItem}
          onTypeFilter={handleTypeFilter}
          onNew={handleNew}
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
            onItemsChanged={() => loadItems(activeType)}
          />
        </div>
      )}
    </div>
  );
}
