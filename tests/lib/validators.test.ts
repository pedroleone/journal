import { describe, it, expect } from "vitest";
import {
  createEntrySchema,
  updateEntrySchema,
  browseQuerySchema,
  createFoodEntrySchema,
  foodListQuerySchema,
  assignFoodEntrySchema,
} from "@/lib/validators";

describe("createEntrySchema", () => {
  const validEntry = {
    encrypted_content: "base64ciphertext",
    iv: "base64iv",
    year: 2026,
    month: 3,
    day: 6,
  };

  it("accepts valid entry", () => {
    const result = createEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("accepts entry with hour", () => {
    const result = createEntrySchema.safeParse({ ...validEntry, hour: 14 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hour).toBe(14);
  });

  it("rejects missing encrypted_content", () => {
    const rest = { ...validEntry };
    delete (rest as Partial<typeof validEntry>).encrypted_content;
    const result = createEntrySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects month out of range", () => {
    expect(createEntrySchema.safeParse({ ...validEntry, month: 0 }).success).toBe(false);
    expect(createEntrySchema.safeParse({ ...validEntry, month: 13 }).success).toBe(false);
  });

  it("rejects day out of range", () => {
    expect(createEntrySchema.safeParse({ ...validEntry, day: 0 }).success).toBe(false);
    expect(createEntrySchema.safeParse({ ...validEntry, day: 32 }).success).toBe(false);
  });

  it("coerces string numbers", () => {
    const result = createEntrySchema.safeParse({
      ...validEntry,
      year: "2026",
      month: "3",
      day: "6",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(2026);
      expect(result.data.month).toBe(3);
    }
  });
});

describe("updateEntrySchema", () => {
  it("accepts valid update", () => {
    const result = updateEntrySchema.safeParse({
      encrypted_content: "newciphertext",
      iv: "newiv",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty encrypted_content", () => {
    const result = updateEntrySchema.safeParse({
      encrypted_content: "",
      iv: "newiv",
    });
    expect(result.success).toBe(false);
  });
});

describe("browseQuerySchema", () => {
  it("accepts empty query", () => {
    const result = browseQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts year filter", () => {
    const result = browseQuerySchema.safeParse({ year: 2026 });
    expect(result.success).toBe(true);
  });

  it("coerces string year", () => {
    const result = browseQuerySchema.safeParse({ year: "2026" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.year).toBe(2026);
  });
});

describe("createFoodEntrySchema", () => {
  it("accepts valid food payload", () => {
    const result = createFoodEntrySchema.safeParse({
      encrypted_content: "base64ciphertext",
      iv: "base64iv",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty iv", () => {
    const result = createFoodEntrySchema.safeParse({
      encrypted_content: "base64ciphertext",
      iv: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("foodListQuerySchema", () => {
  it("coerces boolean and numeric values", () => {
    const result = foodListQuerySchema.safeParse({
      uncategorized: "true",
      year: "2026",
      month: "3",
      day: "6",
      meal_slot: "lunch",
      limit: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.uncategorized).toBe(true);
      expect(result.data.limit).toBe(5);
      expect(result.data.meal_slot).toBe("lunch");
    }
  });

  it("rejects invalid month", () => {
    const result = foodListQuerySchema.safeParse({ month: 13 });
    expect(result.success).toBe(false);
  });
});

describe("assignFoodEntrySchema", () => {
  it("accepts assign payload", () => {
    const result = assignFoodEntrySchema.safeParse({
      year: 2026,
      month: 3,
      day: 6,
      hour: 9,
      meal_slot: "breakfast",
    });
    expect(result.success).toBe(true);
  });

  it("accepts nullable meal slot", () => {
    const result = assignFoodEntrySchema.safeParse({
      year: 2026,
      month: 3,
      day: 6,
      meal_slot: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid meal slot", () => {
    const result = assignFoodEntrySchema.safeParse({
      year: 2026,
      month: 3,
      day: 6,
      meal_slot: "brunch",
    });
    expect(result.success).toBe(false);
  });
});
