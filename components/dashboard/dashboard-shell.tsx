"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BreadcrumbBar } from "./breadcrumb-bar";
import type { Mode } from "@/lib/mode-context";
import { getModeFromPathname } from "@/lib/mode-context";

function getDomain(pathname: string): Mode | "settings" | null {
  if (pathname === "/") return null;
  if (pathname.startsWith("/settings") || pathname.startsWith("/export")) return "settings";
  if (pathname.startsWith("/login")) return null;
  return getModeFromPathname(pathname);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const domain = getDomain(pathname);

  // Dashboard mode (/) or bare pages (login) — no shell chrome
  if (domain === null) {
    return <>{children}</>;
  }

  // Expanded mode — breadcrumb bar + content
  return (
    <div className="flex h-dvh flex-col">
      <BreadcrumbBar domain={domain} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
