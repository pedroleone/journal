"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, LogOut, Settings, Utensils, StickyNote, Sun, Moon } from "lucide-react";
import { signOut } from "next-auth/react";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMode } from "@/lib/mode-context";
import { useLocale } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface EntrySummary {
  id: string;
  source: "web" | "telegram";
}

export function AppNav() {
  const { mode } = useMode();
  const { t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [newPopoverOpen, setNewPopoverOpen] = useState(false);
  const [creatingType, setCreatingType] = useState<"journal" | "food" | "notes" | null>(null);

  async function handleLogout() {
    await signOut({ redirectTo: "/login" });
  }

  function handleSelectJournal() {
    router.push("/journal/browse");
  }

  function handleSelectFood() {
    router.push("/food/browse");
  }

  function handleSelectNotes() {
    router.push("/notes/browse");
  }

  function handleCreateNote() {
    setCreatingType(null);
    setNewPopoverOpen(false);
    router.push("/notes/browse?new=1");
  }

  async function handleCreateJournal() {
    setCreatingType("journal");
    const today = new Date();
    const params = new URLSearchParams({
      year: String(today.getFullYear()),
      month: String(today.getMonth() + 1),
      day: String(today.getDate()),
    });

    try {
      const response = await fetch(`/api/entries?${params.toString()}`);
      if (response.ok) {
        const entries: EntrySummary[] = await response.json();
        const existingWebEntry = entries.find((entry) => entry.source === "web");
        const existingEntry = existingWebEntry ?? entries[0];
        if (existingEntry) {
          setCreatingType(null);
          setNewPopoverOpen(false);
          router.push(`/journal/write?entry=${existingEntry.id}`);
          return;
        }
      }
    } catch {
      // Fall back to write mode.
    }

    setNewPopoverOpen(false);
    router.push("/journal/write");
    setCreatingType(null);
  }

  function handleCreateFood() {
    setCreatingType(null);
    setNewPopoverOpen(false);
    router.push("/food");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSelectJournal}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors",
              mode === "journal"
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.nav.journal}
          </button>
          <button
            onClick={handleSelectFood}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors",
              mode === "food"
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.nav.food}
          </button>
          <button
            onClick={handleSelectNotes}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors",
              mode === "notes"
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.nav.notes}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <InstallAppButton />
          <Popover
            open={newPopoverOpen}
            onOpenChange={(open) => {
              if (creatingType) return;
              setNewPopoverOpen(open);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setCreatingType(null);
                  setNewPopoverOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t.nav.new}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-48 p-1">
              <button
                onClick={() => void handleCreateJournal()}
                disabled={creatingType !== null}
                className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
              >
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                {t.nav.journalEntry}
              </button>
              <button
                onClick={handleCreateFood}
                disabled={creatingType !== null}
                className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
              >
                <Utensils className="h-4 w-4 text-muted-foreground" />
                {t.nav.foodEntry}
              </button>
              <button
                onClick={handleCreateNote}
                disabled={creatingType !== null}
                className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
              >
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                {t.nav.note}
              </button>
            </PopoverContent>
          </Popover>
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
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
