"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Library, StickyNote, Utensils, type LucideIcon } from "lucide-react";
import type { Mode } from "@/lib/mode-context";

interface EntrySummary {
  id: string;
  source: "web";
}

type NavLabelKey = "journal" | "food" | "notes" | "library";
type BrowseLabelKey = "openJournal" | "openFood" | "openNotes" | "openLibrary";
type CreateLabelKey = "newJournalEntry" | "newFoodEntry" | "newNote" | "newLibraryItem";

export interface NavSection {
  key: Mode;
  icon: LucideIcon;
  browseRoute: string;
  i18nKeys: {
    label: NavLabelKey;
    browse: BrowseLabelKey;
    create: CreateLabelKey;
  };
}

export const NAV_SECTIONS: NavSection[] = [
  {
    key: "journal",
    icon: BookOpen,
    browseRoute: "/journal/browse",
    i18nKeys: {
      label: "journal",
      browse: "openJournal",
      create: "newJournalEntry",
    },
  },
  {
    key: "food",
    icon: Utensils,
    browseRoute: "/food/browse",
    i18nKeys: {
      label: "food",
      browse: "openFood",
      create: "newFoodEntry",
    },
  },
  {
    key: "notes",
    icon: StickyNote,
    browseRoute: "/notes/browse",
    i18nKeys: {
      label: "notes",
      browse: "openNotes",
      create: "newNote",
    },
  },
  {
    key: "library",
    icon: Library,
    browseRoute: "/library/browse",
    i18nKeys: {
      label: "library",
      browse: "openLibrary",
      create: "newLibraryItem",
    },
  },
];

export interface CreateHandlers {
  createJournal: () => Promise<void>;
  createFood: () => void;
  createNote: () => void;
  createLibrary: () => void;
}

export function useCreateHandlers(): CreateHandlers {
  const router = useRouter();

  const createJournal = useCallback(async () => {
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
        const existingEntry = entries[0];
        if (existingEntry) {
          router.push(`/journal/write?entry=${existingEntry.id}`);
          return;
        }
      }
    } catch {
      // Fall back to write mode.
    }

    router.push("/journal/write");
  }, [router]);

  const createFood = useCallback(() => {
    router.push("/food");
  }, [router]);

  const createNote = useCallback(() => {
    router.push("/notes/browse?new=1");
  }, [router]);

  const createLibrary = useCallback(() => {
    router.push("/library/new");
  }, [router]);

  return {
    createJournal,
    createFood,
    createNote,
    createLibrary,
  };
}
