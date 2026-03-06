"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";

export function AppNav() {
  const { mode, setMode } = useMode();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <TooltipProvider delayDuration={300}>
      <nav className="border-b border-border/60">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("journal")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                mode === "journal"
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Journal
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed"
                  disabled
                >
                  Food
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming soon</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5"
            >
              <Link href="/write">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </Link>
            </Button>
            <button
              onClick={handleLogout}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
