"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
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
}

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
    <div className="flex items-center gap-2 py-1">
      {item.cover_image ? (
        <div className="h-8 w-6 shrink-0 overflow-hidden rounded-sm bg-muted">
          <img
            src={`/api/images/${encodeURIComponent(item.cover_image)}`}
            alt=""
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
    </div>
  );
}

export function LibraryQuadrant() {
  const [inProgress, setInProgress] = useState<LibraryItem[]>([]);
  const [recentFinished, setRecentFinished] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/library?status=in_progress").then((r) => r.json()),
      fetch("/api/library?status=finished").then((r) => r.json()),
    ])
      .then(([ip, fin]: [LibraryItem[], LibraryItem[]]) => {
        setInProgress(ip);
        setRecentFinished(fin.slice(0, 3));
      })
      .catch(() => {
        setInProgress([]);
        setRecentFinished([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = inProgress.length + recentFinished.length;

  return (
    <QuadrantCard
      domain="library"
      label="Library"
      href="/library/browse"
      actions={
        <Link
          href="/library/new"
          className="rounded bg-[var(--library-dim)] px-2 py-0.5 text-xs font-medium text-[var(--library)] hover:bg-[var(--library)]/25"
        >
          <Plus className="mr-1 inline-block h-3 w-3" />
          Add
        </Link>
      }
      footer={<span>{total} items</span>}
    >
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted/30" />
          ))}
        </div>
      ) : total > 0 ? (
        <div className="space-y-1">
          {inProgress.length > 0 && (
            <>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                In Progress
              </p>
              {inProgress.slice(0, 3).map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </>
          )}
          {recentFinished.length > 0 && (
            <>
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Recently Finished
              </p>
              {recentFinished.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </>
          )}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No items yet
        </p>
      )}
    </QuadrantCard>
  );
}
