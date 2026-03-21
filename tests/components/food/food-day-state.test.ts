import { describe, expect, it } from "vitest";
import {
  buildMealSlotState,
  groupEntriesByMealSlot,
} from "@/components/food/food-day-state";

describe("food day state", () => {
  it("returns a filled slot state with multiple real entries", () => {
    const state = buildMealSlotState("breakfast", [
      { id: "1", meal_slot: "breakfast", tags: null },
      { id: "2", meal_slot: "breakfast", tags: null },
    ]);

    expect(state.kind).toBe("filled");
    expect(state.entries).toHaveLength(2);
  });

  it("returns a skipped slot state when the slot has a skipped entry", () => {
    const state = buildMealSlotState("lunch", [
      { id: "3", meal_slot: "lunch", tags: ["skipped"] },
    ]);

    expect(state.kind).toBe("skipped");
  });

  it("returns an empty slot state when there are no entries for the slot", () => {
    const state = buildMealSlotState("dinner", []);

    expect(state.kind).toBe("empty");
  });

  it("groups entries by meal slot for page rendering", () => {
    const grouped = groupEntriesByMealSlot([
      { id: "1", meal_slot: "breakfast", tags: null },
      { id: "2", meal_slot: "lunch", tags: null },
    ]);

    expect(grouped.breakfast).toHaveLength(1);
    expect(grouped.lunch).toHaveLength(1);
    expect(grouped.dinner).toHaveLength(0);
    expect(grouped.observation).toHaveLength(0);
  });
});
