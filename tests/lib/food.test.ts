import { describe, expect, it } from "vitest";
import { getMonthDays, suggestMealSlot } from "@/lib/food";

describe("suggestMealSlot", () => {
  it("maps boundary hours correctly", () => {
    expect(suggestMealSlot(10)).toBe("breakfast");
    expect(suggestMealSlot(11)).toBe("lunch");
    expect(suggestMealSlot(14)).toBe("lunch");
    expect(suggestMealSlot(15)).toBe("snack");
    expect(suggestMealSlot(16)).toBe("snack");
    expect(suggestMealSlot(17)).toBe("dinner");
  });
});

describe("getMonthDays", () => {
  it("returns all days for a 31-day month", () => {
    const days = getMonthDays(2026, 3);
    expect(days[0]).toBe(1);
    expect(days[days.length - 1]).toBe(31);
  });

  it("handles leap year february", () => {
    const days = getMonthDays(2024, 2);
    expect(days.length).toBe(29);
  });
});
