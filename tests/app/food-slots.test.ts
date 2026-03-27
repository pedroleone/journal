import { describe, it, expect } from "vitest";
import { getVisibleSlots } from "@/lib/food";

describe("getVisibleSlots", () => {
  it("shows breakfast, lunch, dinner, observation by default", () => {
    const visible = getVisibleSlots([], false);
    expect(visible).toEqual(["breakfast", "lunch", "dinner", "observation"]);
  });

  it("shows all slots when expanded", () => {
    const visible = getVisibleSlots([], true);
    expect(visible).toHaveLength(7);
    expect(visible).toContain("morning_snack");
    expect(visible).toContain("afternoon_snack");
    expect(visible).toContain("midnight_snack");
  });

  it("shows snack slot if it has content even when collapsed", () => {
    const entries = [{ meal_slot: "morning_snack" }];
    const visible = getVisibleSlots(entries, false);
    expect(visible).toContain("morning_snack");
    expect(visible).not.toContain("afternoon_snack");
  });

  it("orders slots chronologically", () => {
    const visible = getVisibleSlots([], true);
    expect(visible).toEqual([
      "breakfast",
      "morning_snack",
      "lunch",
      "afternoon_snack",
      "dinner",
      "midnight_snack",
      "observation",
    ]);
  });
});
