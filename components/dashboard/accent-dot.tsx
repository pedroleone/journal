"use client";

import type { Mode } from "@/lib/mode-context";

const ACCENT_COLORS: Record<Mode, string> = {
  journal: "bg-[var(--journal)]",
  food: "bg-[var(--food)]",
  notes: "bg-[var(--notes)]",
  library: "bg-[var(--library)]",
};

export function AccentDot({ domain }: { domain: Mode }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ACCENT_COLORS[domain]}`}
    />
  );
}
