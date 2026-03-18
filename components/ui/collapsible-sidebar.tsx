"use client";
import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  /** Mobile-only: parent controls show/hide via this prop. Desktop ignores it. */
  visible: boolean;
}

export function CollapsibleSidebar({ children, visible }: CollapsibleSidebarProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
  }

  if (isMobile) {
    if (!visible) return null;
    return <div className="w-full border-r border-border/60">{children}</div>;
  }

  return (
    <div className={cn(
      "shrink-0 border-r border-border/60 overflow-hidden transition-[width] duration-200",
      collapsed ? "w-10" : "w-64",
    )}>
      <div className={cn("flex pt-2", collapsed ? "justify-center" : "justify-end px-2")}>
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      {!collapsed && children}
    </div>
  );
}
