export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export function suggestMealSlot(hour: number): MealSlot {
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 17) return "snack";
  return "dinner";
}

export function getMonthDays(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}
