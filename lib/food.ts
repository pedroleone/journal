export type MealSlot =
  | "breakfast"
  | "morning_snack"
  | "lunch"
  | "afternoon_snack"
  | "dinner"
  | "midnight_snack"
  | "observation";

export const MEAL_SLOTS: MealSlot[] = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "midnight_snack",
  "observation",
];

const SLOT_ORDER: MealSlot[] = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "midnight_snack",
  "observation",
];

const DEFAULT_VISIBLE: MealSlot[] = [
  "breakfast",
  "lunch",
  "dinner",
  "observation",
];

const SNACK_SLOTS: MealSlot[] = [
  "morning_snack",
  "afternoon_snack",
  "midnight_snack",
];

export function getVisibleSlots(
  entries: { meal_slot: MealSlot | string | null }[],
  expanded: boolean,
): MealSlot[] {
  if (expanded) return [...SLOT_ORDER];

  const filledSnacks = new Set(
    entries
      .filter((e) => e.meal_slot && SNACK_SLOTS.includes(e.meal_slot as MealSlot))
      .map((e) => e.meal_slot as MealSlot),
  );

  const visible = new Set<MealSlot>(DEFAULT_VISIBLE);
  for (const s of filledSnacks) visible.add(s);

  return SLOT_ORDER.filter((s) => visible.has(s));
}

export function suggestMealSlot(hour: number): MealSlot {
  if (hour < 10) return "breakfast";
  if (hour < 12) return "morning_snack";
  if (hour < 14) return "lunch";
  if (hour < 17) return "afternoon_snack";
  if (hour < 21) return "dinner";
  return "midnight_snack";
}

export function getMonthDays(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

export function getFoodEntryPreview(entry: {
  content?: string | null;
  encrypted_content?: string | null;
}) {
  return entry.content ?? entry.encrypted_content ?? "";
}
