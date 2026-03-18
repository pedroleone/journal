"use client";

import { useRouter } from "next/navigation";
import { BookOpen, Plus, LogOut, Settings, Utensils, StickyNote, Library, Sun, Moon } from "lucide-react";
import { signOut } from "next-auth/react";
import { InstallAppButton } from "@/components/pwa/install-app-button";
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
    router.push("/notes/browse?new=1");
  }

  function handleSelectLibrary() {
    router.push("/library/browse");
  }

  function handleCreateLibrary() {
    router.push("/library/new");
  }

  async function handleCreateJournal() {
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
          router.push(`/journal/write?entry=${existingEntry.id}`);
          return;
        }
      }
    } catch {
      // Fall back to write mode.
    }

    router.push("/journal/write");
  }

  function handleCreateFood() {
    router.push("/food");
  }

  const sections = [
    {
      key: "journal",
      icon: BookOpen,
      label: t.nav.journal,
      browseLabel: t.nav.openJournal,
      createLabel: t.nav.newJournalEntry,
      onBrowse: handleSelectJournal,
      onCreate: () => void handleCreateJournal(),
    },
    {
      key: "food",
      icon: Utensils,
      label: t.nav.food,
      browseLabel: t.nav.openFood,
      createLabel: t.nav.newFoodEntry,
      onBrowse: handleSelectFood,
      onCreate: handleCreateFood,
    },
    {
      key: "notes",
      icon: StickyNote,
      label: t.nav.notes,
      browseLabel: t.nav.openNotes,
      createLabel: t.nav.newNote,
      onBrowse: handleSelectNotes,
      onCreate: handleCreateNote,
    },
    {
      key: "library",
      icon: Library,
      label: t.nav.library,
      browseLabel: t.nav.openLibrary,
      createLabel: t.nav.newLibraryItem,
      onBrowse: handleSelectLibrary,
      onCreate: handleCreateLibrary,
    },
  ] as const;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex min-w-0 items-center gap-1">
          {sections.map((section) => {
            const isActive = mode === section.key;
            const Icon = section.icon;

            return (
              <div
                key={section.key}
                className="flex shrink-0 overflow-hidden rounded-md border border-border/60 bg-background/80"
              >
                <button
                  onClick={section.onBrowse}
                  aria-label={section.browseLabel}
                  aria-current={isActive ? "page" : undefined}
                  title={section.browseLabel}
                  className={cn(
                    "flex h-9 items-center gap-2 px-3 text-sm transition-colors",
                    isActive
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                </button>
                <button
                  onClick={section.onCreate}
                  aria-label={section.createLabel}
                  title={section.createLabel}
                  className={cn(
                    "flex h-9 items-center justify-center border-l border-border/60 px-2.5 transition-colors",
                    isActive
                      ? "bg-secondary text-foreground hover:bg-secondary"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <InstallAppButton />
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
