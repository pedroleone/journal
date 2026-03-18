"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import type { MediaType, MediaStatus } from "@/lib/library";

const STATUS_COLORS: Record<MediaStatus, string> = {
  backlog: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  finished: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dropped: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface StatusTransitionProps {
  status: MediaStatus;
  type: MediaType;
  onStatusChange: (status: MediaStatus) => void;
}

/**
 * Directional status transition chips.
 * backlog → in_progress
 * in_progress → finished | dropped
 * finished/dropped → (show current, optional undo to in_progress)
 * Albums: hide dropped, use Listening/Listened labels.
 */
export function StatusTransition({ status, type, onStatusChange }: StatusTransitionProps) {
  const { t } = useLocale();
  const isAlbum = type === "album";

  const labels: Record<MediaStatus, string> = {
    backlog: t.library.backlog,
    in_progress: isAlbum ? t.library.listening : t.library.inProgress,
    finished: isAlbum ? t.library.listened : t.library.finished,
    dropped: t.library.dropped,
  };

  function getTransitions(): MediaStatus[] {
    switch (status) {
      case "backlog":
        return ["in_progress"];
      case "in_progress":
        return isAlbum ? ["finished"] : ["finished", "dropped"];
      case "finished":
      case "dropped":
        return ["in_progress"];
    }
  }

  const transitions = getTransitions();
  const isTerminal = status === "finished" || status === "dropped";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Current status badge */}
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-xs font-medium",
          STATUS_COLORS[status],
        )}
      >
        {labels[status]}
      </span>

      {/* Transition buttons */}
      {transitions.map((target) => (
        <button
          key={target}
          onClick={() => onStatusChange(target)}
          className={cn(
            "rounded-full border border-border/60 px-2.5 py-1 text-xs transition-colors",
            "text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/50",
            isTerminal && "text-muted-foreground/50",
          )}
        >
          {isTerminal ? `↩ ${labels[target]}` : `→ ${labels[target]}`}
        </button>
      ))}
    </div>
  );
}
