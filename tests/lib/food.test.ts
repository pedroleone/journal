import { describe, expect, it } from "vitest";
import { getFoodEntryPreview, getMonthDays, suggestMealSlot } from "@/lib/food";

describe("suggestMealSlot", () => {
  it("maps boundary hours correctly", () => {
    expect(suggestMealSlot(9)).toBe("breakfast");
    expect(suggestMealSlot(10)).toBe("morning_snack");
    expect(suggestMealSlot(11)).toBe("morning_snack");
    expect(suggestMealSlot(12)).toBe("lunch");
    expect(suggestMealSlot(13)).toBe("lunch");
    expect(suggestMealSlot(14)).toBe("afternoon_snack");
    expect(suggestMealSlot(16)).toBe("afternoon_snack");
    expect(suggestMealSlot(17)).toBe("dinner");
    expect(suggestMealSlot(20)).toBe("dinner");
    expect(suggestMealSlot(21)).toBe("midnight_snack");
    expect(suggestMealSlot(23)).toBe("midnight_snack");
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

describe("getFoodEntryPreview", () => {
  it("prefers decrypted content from list responses", () => {
    expect(getFoodEntryPreview({
      content: "Roast chicken with rice and salad",
      encrypted_content: undefined,
    })).toBe("Roast chicken with rice and salad");
  });

  it("falls back to encrypted content when decrypted content is unavailable", () => {
    expect(getFoodEntryPreview({
      encrypted_content: "ciphertext-preview",
    })).toBe("ciphertext-preview");
  });

  it("returns an empty preview when no content fields are present", () => {
    expect(getFoodEntryPreview({})).toBe("");
  });
});
