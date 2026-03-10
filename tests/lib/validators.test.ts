import { describe, it, expect } from "vitest";
import {
  createEntrySchema,
  updateEntrySchema,
  browseQuerySchema,
  createFoodEntrySchema,
  foodListQuerySchema,
  assignFoodEntrySchema,
  updateFoodContentSchema,
  backupPayloadSchema,
} from "@/lib/validators";

describe("createEntrySchema", () => {
  const validEntry = {
    content: "draft text",
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

  it("rejects missing content", () => {
    const rest = { ...validEntry };
    delete (rest as Partial<typeof validEntry>).content;
    const result = createEntrySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("accepts draft entry creation when image upload intent is present", () => {
    const result = createEntrySchema.safeParse({
      ...validEntry,
      content: "",
      images: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content when images are omitted", () => {
    const result = createEntrySchema.safeParse({
      ...validEntry,
      content: "",
    });
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
      content: "new text",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content without images", () => {
    const result = updateEntrySchema.safeParse({
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts image-only update", () => {
    const result = updateEntrySchema.safeParse({
      content: "",
      images: ["image.enc"],
    });
    expect(result.success).toBe(true);
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
      content: "omelette",
    });
    expect(result.success).toBe(true);
  });

  it("accepts draft food entry creation for image-first uploads", () => {
    const result = createFoodEntrySchema.safeParse({
      content: "",
      images: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content when no image upload intent exists", () => {
    const result = createFoodEntrySchema.safeParse({
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts entry with meal_slot and date", () => {
    const result = createFoodEntrySchema.safeParse({
      content: "Eggs",
      meal_slot: "breakfast",
      year: 2026,
      month: 3,
      day: 9,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meal_slot).toBe("breakfast");
      expect(result.data.year).toBe(2026);
    }
  });

  it("accepts skipped entry with empty content", () => {
    const result = createFoodEntrySchema.safeParse({
      content: "",
      meal_slot: "lunch",
      year: 2026,
      month: 3,
      day: 9,
      tags: ["skipped"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts new meal slot values", () => {
    for (const slot of ["morning_snack", "afternoon_snack", "midnight_snack"]) {
      const result = createFoodEntrySchema.safeParse({
        content: "Snack",
        meal_slot: slot,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects old snack value", () => {
    const result = createFoodEntrySchema.safeParse({
      content: "Snack",
      meal_slot: "snack",
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

  it("accepts new meal slot values", () => {
    for (const slot of ["morning_snack", "afternoon_snack", "midnight_snack"]) {
      const result = foodListQuerySchema.safeParse({ meal_slot: slot });
      expect(result.success).toBe(true);
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

  it("accepts new meal slot values", () => {
    for (const slot of ["morning_snack", "afternoon_snack", "midnight_snack"]) {
      const result = assignFoodEntrySchema.safeParse({
        year: 2026,
        month: 3,
        day: 6,
        meal_slot: slot,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("updateFoodContentSchema", () => {
  it("accepts valid content", () => {
    const result = updateFoodContentSchema.safeParse({ content: "Updated meal" });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = updateFoodContentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });
});

describe("backupPayloadSchema", () => {
  it("accepts version 2 plaintext backups", () => {
    const result = backupPayloadSchema.safeParse({
      version: 2,
      exported_at: "2026-03-07T10:00:00.000Z",
      journal_entries: [
        {
          id: "j-1",
          userId: "user-1",
          source: "web",
          year: 2026,
          month: 3,
          day: 7,
          hour: 9,
          content: "entry text",
          images: null,
          tags: null,
          created_at: "2026-03-07T10:00:00.000Z",
          updated_at: "2026-03-07T10:00:00.000Z",
        },
      ],
      food_entries: [],
      image_blobs: [
        {
          key: "user-1/journal/j-1/photo.enc",
          content_type: "image/jpeg",
          data: "AQID",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts backup with old snack meal_slot for backward compat", () => {
    const result = backupPayloadSchema.safeParse({
      version: 2,
      exported_at: "2026-03-07T10:00:00.000Z",
      journal_entries: [],
      food_entries: [
        {
          id: "f-1",
          userId: "user-1",
          source: "web",
          year: 2026,
          month: 3,
          day: 7,
          hour: 15,
          meal_slot: "snack",
          assigned_at: "2026-03-07T15:00:00.000Z",
          logged_at: "2026-03-07T15:00:00.000Z",
          content: "cookies",
          images: null,
          tags: null,
          created_at: "2026-03-07T15:00:00.000Z",
          updated_at: "2026-03-07T15:00:00.000Z",
        },
      ],
      image_blobs: [],
    });

    expect(result.success).toBe(true);
  });
});
