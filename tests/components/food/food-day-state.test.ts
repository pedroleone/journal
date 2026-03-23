import { describe, expect, expectTypeOf, it } from "vitest";
import {
  buildMealSlotState,
  groupEntriesByMealSlot,
} from "@/components/food/food-day-state";
import type { MealSlotCardState } from "@/components/food/food-meal-slot-card";

describe("food day state", () => {
  it("returns a filled slot state with multiple real entries", () => {
    const state = buildMealSlotState("breakfast", [
      {
        id: "1",
        meal_slot: "breakfast",
        tags: null,
        content: "eggs",
        logged_at: "2026-03-23T08:00:00.000Z",
        images: null,
        hour: 8,
      },
      {
        id: "2",
        meal_slot: "breakfast",
        tags: null,
        content: "toast",
        logged_at: "2026-03-23T08:30:00.000Z",
        images: null,
        hour: 8,
      },
    ]);

    expect(state.kind).toBe("filled");
    expect(state.entries).toHaveLength(2);
    expectTypeOf(state).toEqualTypeOf<MealSlotCardState>();
  });

  it("returns a skipped slot state when the slot has a skipped entry", () => {
    const state = buildMealSlotState("lunch", [
      {
        id: "3",
        meal_slot: "lunch",
        tags: ["skipped"],
        content: "",
        logged_at: "2026-03-23T12:00:00.000Z",
        images: null,
        hour: 12,
      },
    ]);

    expect(state.kind).toBe("skipped");
    if (state.kind === "skipped") {
      expectTypeOf(state.entries).toEqualTypeOf<[]>();
    }
    expectTypeOf(state).toEqualTypeOf<MealSlotCardState>();
  });

  it("returns an empty slot state when there are no entries for the slot", () => {
    const state = buildMealSlotState("dinner", []);

    expect(state.kind).toBe("empty");
    if (state.kind === "empty") {
      expectTypeOf(state.entries).toEqualTypeOf<[]>();
    }
    expectTypeOf(state).toEqualTypeOf<MealSlotCardState>();
  });

  it("groups entries by meal slot for page rendering", () => {
    const grouped = groupEntriesByMealSlot([
      {
        id: "1",
        meal_slot: "breakfast",
        tags: null,
        content: "eggs",
        logged_at: "2026-03-23T08:00:00.000Z",
        images: null,
        hour: 8,
      },
      {
        id: "2",
        meal_slot: "lunch",
        tags: null,
        content: "salad",
        logged_at: "2026-03-23T12:00:00.000Z",
        images: null,
        hour: 12,
      },
    ]);

    expect(grouped.breakfast).toHaveLength(1);
    expect(grouped.lunch).toHaveLength(1);
    expect(grouped.dinner).toHaveLength(0);
    expect(grouped.observation).toHaveLength(0);
  });
});
