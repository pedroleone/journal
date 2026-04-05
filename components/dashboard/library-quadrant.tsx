"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Pencil, Plus } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { QuadrantCard } from "./quadrant-card";
import { LibraryProgressModal } from "./library-progress-modal";
import { getBookProgressPercent, type BookProgressMetadata, type MediaStatus } from "@/lib/library";

interface LibraryItem {
  id: string;
  title: string;
  creator: string | null;
  type: string;
  status: MediaStatus;
  rating: number | null;
  cover_image: string | null;
  metadata: BookProgressMetadata | null;
  added_at: string;
  finished_at: string | null;
  updated_at: string;
}

const DESKTOP_ITEM_LIMIT = 30;
const MOBILE_ITEM_LIMIT = 10;
const RECENT_FINISHED_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-[var(--library-dim)] text-[var(--library)]",
  finished: "bg-green-500/15 text-green-500",
  backlog: "bg-muted text-muted-foreground",
};

function StatusPill({ status }: { status: string }) {
  const label = status.replace("_", " ");
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] capitalize ${STATUS_COLORS[status] ?? STATUS_COLORS.backlog}`}
    >
      {label}
    </span>
  );
}

function ItemRow({ item, onOpenProgressModal }: { item: LibraryItem; onOpenProgressModal?: (id: string) => void }) {
  const progressPercent =
    item.type === "book" && item.status === "in_progress"
      ? getBookProgressPercent(item.metadata)
      : null;

  return (
    <Link
      href={`/library/${encodeURIComponent(item.id)}`}
      className="pointer-events-auto flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-[var(--library-dim)]/65"
    >
      {item.cover_image ? (
        <div className="h-8 w-6 shrink-0 overflow-hidden rounded-sm bg-muted">
          <Image
            src={`/api/images/${encodeURIComponent(item.cover_image)}`}
            alt=""
            unoptimized
            width={24}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-8 w-6 shrink-0 rounded-sm bg-muted" />
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm">{item.title}</p>
        {item.creator && (
          <p className="truncate text-xs text-muted-foreground">
            {item.creator}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {progressPercent !== null && (
          <span className="whitespace-nowrap text-xs font-medium tabular-nums text-muted-foreground">
            {progressPercent}%
          </span>
        )}
        <StatusPill status={item.status} />
        {item.type === "book" && item.status === "in_progress" && onOpenProgressModal && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenProgressModal(item.id); }}
            className="shrink-0 rounded p-0.5 text-muted-foreground/40 hover:text-[var(--library)] hover:bg-[var(--library-dim)] transition-colors"
            aria-label="Update progress"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
    </Link>
  );
}

export function LibraryQuadrant() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [inProgress, setInProgress] = useState<LibraryItem[]>([]);
  const [recentFinished, setRecentFinished] = useState<LibraryItem[]>([]);
  const [backlog, setBacklog] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [renderTime] = useState(() => Date.now());
  const [progressModalItemId, setProgressModalItemId] = useState<string | null>(null);

  const limit = isDesktop ? DESKTOP_ITEM_LIMIT : MOBILE_ITEM_LIMIT;

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/library?status=in_progress&limit=${limit}`).then((r) => r.json()),
      fetch(`/api/library?status=finished&limit=${limit}`).then((r) => r.json()),
      fetch(`/api/library?status=backlog&limit=${limit}`).then((r) => r.json()),
    ])
      .then(([ip, fin, backlogItems]: [LibraryItem[], LibraryItem[], LibraryItem[]]) => {
        setInProgress(ip);
        setRecentFinished(fin);
        setBacklog(backlogItems);
      })
      .catch(() => {
        setInProgress([]);
        setRecentFinished([]);
        setBacklog([]);
      })
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const recentFinishedItems = recentFinished
    .filter((item) => {
      if (!item.finished_at) return false;
      return renderTime - new Date(item.finished_at).getTime() <= RECENT_FINISHED_WINDOW_MS;
    })
    .sort((a, b) => new Date(b.finished_at ?? 0).getTime() - new Date(a.finished_at ?? 0).getTime());

  const prioritizedItems = [
    ...inProgress.toSorted((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    ...recentFinishedItems,
    ...backlog.toSorted((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()),
  ].slice(0, limit);

  const total = inProgress.length + recentFinishedItems.length + backlog.length;

  return (
    <>
    <QuadrantCard
      domain="library"
      label="Library"
      href="/library/browse"
      actions={
        <>
          <Link
            href="/library/browse"
            className="rounded bg-[var(--library-dim)] px-2 py-0.5 text-xs font-medium text-[var(--library)] hover:bg-[var(--library)]/25"
          >
            <BookOpen className="mr-1 inline-block h-3 w-3" />
            Browse
          </Link>
          <Link
            href="/library/new"
            className="rounded bg-[var(--library-dim)] px-2 py-0.5 text-xs font-medium text-[var(--library)] hover:bg-[var(--library)]/25"
          >
            <Plus className="mr-1 inline-block h-3 w-3" />
            Add
          </Link>
        </>
      }
      footer={<span>{total} items</span>}
    >
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted/30" />
          ))}
        </div>
      ) : prioritizedItems.length > 0 ? (
        <div className="space-y-1">
          {prioritizedItems.map((item) => (
            <ItemRow key={item.id} item={item} onOpenProgressModal={setProgressModalItemId} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No items yet
        </p>
      )}
    </QuadrantCard>

    <LibraryProgressModal
      itemId={progressModalItemId ?? ""}
      open={progressModalItemId !== null}
      onOpenChange={(open) => { if (!open) setProgressModalItemId(null); }}
      onSuccess={fetchData}
    />
    </>
  );
}
