import type { MealSlotCardState, FilledEntry } from "@/components/food/food-meal-slot-card";
import type { MealSlot } from "@/lib/food";

type DayEntry = FilledEntry & {
  id: string;
  meal_slot: MealSlot | null;
  tags: string[] | null;
};

type MealSlotGroups = Record<MealSlot, DayEntry[]>;

export function groupEntriesByMealSlot(entries: DayEntry[]): MealSlotGroups {
  return {
    breakfast: entries.filter((entry) => entry.meal_slot === "breakfast"),
    morning_snack: entries.filter((entry) => entry.meal_slot === "morning_snack"),
    lunch: entries.filter((entry) => entry.meal_slot === "lunch"),
    afternoon_snack: entries.filter((entry) => entry.meal_slot === "afternoon_snack"),
    dinner: entries.filter((entry) => entry.meal_slot === "dinner"),
    midnight_snack: entries.filter((entry) => entry.meal_slot === "midnight_snack"),
    observation: entries.filter((entry) => entry.meal_slot === "observation"),
  };
}

export function buildMealSlotState(slot: MealSlot, entries: DayEntry[]): MealSlotCardState {
  const slotEntries = groupEntriesByMealSlot(entries)[slot];
  const skippedEntry = slotEntries.find((entry) => entry.tags?.includes("skipped"));
  const realEntries = slotEntries.filter((entry) => !entry.tags?.includes("skipped"));

  if (skippedEntry) {
    return {
      kind: "skipped" as const,
      skippedEntry,
      entries: [] as [],
    };
  }

  if (realEntries.length === 0) {
    return {
      kind: "empty" as const,
      entries: [] as [],
    };
  }

  return {
    kind: "filled" as const,
    entries: realEntries,
  };
}
