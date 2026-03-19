"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface StatusBadgeProps {
  status?: SaveStatus;
  savedAt?: Date | null;
}

export function StatusBadge({ status = "idle", savedAt }: StatusBadgeProps) {
  const online = useOnlineStatus();

  if (!online) {
    return <span className="text-xs text-amber-500">Offline</span>;
  }

  if (status === "saving") {
    return <span className="text-xs text-muted-foreground">Saving…</span>;
  }

  if (status === "saved") {
    const label = savedAt
      ? `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "Saved";
    return <span className="text-xs text-green-500">{label}</span>;
  }

  if (status === "error") {
    return <span className="text-xs text-destructive">Save failed</span>;
  }

  return null;
}
