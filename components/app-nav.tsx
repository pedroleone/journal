"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, LogOut, Settings, Utensils, StickyNote } from "lucide-react";
import { signOut } from "next-auth/react";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";

interface EntrySummary {
  id: string;
  source: "web" | "telegram";
}

export function AppNav() {
  const { mode } = useMode();
  const router = useRouter();
  const [newDialogOpen, setNewDialogOpen] = useState(false);
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
    setNewDialogOpen(false);
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
          setNewDialogOpen(false);
          router.push(`/journal/write?entry=${existingEntry.id}`);
          return;
        }
      }
    } catch {
      // Fall back to write mode.
    }

    setNewDialogOpen(false);
    router.push("/journal/write");
    setCreatingType(null);
  }

  function handleCreateFood() {
    setCreatingType(null);
    setNewDialogOpen(false);
    router.push("/food");
  }

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
          <button
            onClick={handleSelectNotes}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              mode === "notes"
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Notes
          </button>
        </div>

        <div className="flex items-center gap-2">
          <InstallAppButton />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setCreatingType(null);
              setNewDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
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

      <Dialog
        open={newDialogOpen}
        onOpenChange={(open) => {
          if (creatingType) return;
          setNewDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create new entry</DialogTitle>
            <DialogDescription>
              Choose what kind of entry you want to create.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Button
              variant="outline"
              className="h-auto items-start justify-start gap-3 px-4 py-4 text-left"
              onClick={() => {
                void handleCreateJournal();
              }}
              disabled={creatingType !== null}
            >
              <BookOpen className="mt-0.5 h-4 w-4" />
              <span className="flex flex-col items-start">
                <span>Journal entry</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Open today&apos;s journal entry or start a new one.
                </span>
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto items-start justify-start gap-3 px-4 py-4 text-left"
              onClick={handleCreateFood}
              disabled={creatingType !== null}
            >
              <Utensils className="mt-0.5 h-4 w-4" />
              <span className="flex flex-col items-start">
                <span>Food entry</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Open the quick food log to add a new entry.
                </span>
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto items-start justify-start gap-3 px-4 py-4 text-left"
              onClick={handleCreateNote}
              disabled={creatingType !== null}
            >
              <StickyNote className="mt-0.5 h-4 w-4" />
              <span className="flex flex-col items-start">
                <span>Note</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Create a new note with optional title and tags.
                </span>
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
