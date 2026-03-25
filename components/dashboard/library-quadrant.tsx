"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { QuadrantCard } from "./quadrant-card";
import type { MediaStatus } from "@/lib/library";

interface LibraryItem {
  id: string;
  title: string;
  creator: string | null;
  type: string;
  status: MediaStatus;
  rating: number | null;
  cover_image: string | null;
  added_at: string;
  finished_at: string | null;
  updated_at: string;
}

const DASHBOARD_ITEM_LIMIT = 6;
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

function ItemRow({ item }: { item: LibraryItem }) {
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
      <StatusPill status={item.status} />
    </Link>
  );
}

export function LibraryQuadrant() {
  const [inProgress, setInProgress] = useState<LibraryItem[]>([]);
  const [recentFinished, setRecentFinished] = useState<LibraryItem[]>([]);
  const [backlog, setBacklog] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [renderTime] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([
      fetch("/api/library?status=in_progress").then((r) => r.json()),
      fetch("/api/library?status=finished").then((r) => r.json()),
      fetch("/api/library?status=backlog").then((r) => r.json()),
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
  }, []);

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
  ].slice(0, DASHBOARD_ITEM_LIMIT);

  const total = inProgress.length + recentFinishedItems.length + backlog.length;

  return (
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
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No items yet
        </p>
      )}
    </QuadrantCard>
  );
}
