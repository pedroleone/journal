"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Button } from "@/components/ui/button";
import { wipeKey } from "@/lib/key-manager";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";

export function AppNav() {
  const { mode, setMode } = useMode();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    wipeKey();
    await signOut({ redirectTo: "/login" });
  }

  function handleSelectJournal() {
    setMode("journal");
    if (pathname.startsWith("/food")) {
      router.push("/journal/browse?mode=journal");
    }
  }

  function handleSelectFood() {
    setMode("food");
    if (!pathname.startsWith("/food")) {
      router.push("/food?mode=food");
    }
  }

  const newHref = mode === "food" ? "/food?mode=food" : "/journal/write?mode=journal";

  return (
    <nav className="border-b border-border/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSelectJournal}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              mode === "journal"
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Journal
          </button>
          <button
            onClick={handleSelectFood}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              mode === "food"
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Food
          </button>
        </div>

        <div className="flex items-center gap-2">
          <InstallAppButton />
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5"
          >
            <Link href={newHref}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Link>
          </Button>
          <button
            onClick={handleLogout}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
