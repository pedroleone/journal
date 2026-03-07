import { z } from "zod";

const encryptedPayloadFields = {
  content: z.string(),
  images: z.array(z.string().min(1)).nullable().optional(),
};

function hasContentOrImages(value: {
  content: string;
  images?: string[] | null;
}) {
  const hasImages = (value.images?.length ?? 0) > 0;
  const hasText = value.content.length > 0;
  return hasImages || hasText;
}

function hasContentOrImageIntent(value: {
  content: string;
  images?: string[] | null;
}) {
  return value.content.length > 0 || value.images !== undefined;
}

export const createEntrySchema = z
  .object({
    ...encryptedPayloadFields,
    year: z.coerce.number().int(),
    month: z.coerce.number().int().min(1).max(12),
    day: z.coerce.number().int().min(1).max(31),
    hour: z.coerce.number().int().min(0).max(23).optional(),
  })
  .refine(hasContentOrImageIntent, {
    message: "Entry must include text or at least one image",
  });

export const updateEntrySchema = z
  .object({
    ...encryptedPayloadFields,
  })
  .refine(hasContentOrImages, {
    message: "Entry must include text or at least one image",
  });

export const browseQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().optional(),
  day: z.coerce.number().int().optional(),
});

const boolFromString = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

export const createFoodEntrySchema = z
  .object({
    ...encryptedPayloadFields,
  })
  .refine(hasContentOrImageIntent, {
    message: "Food entry must include text or at least one image",
  });

export const foodListQuerySchema = z.object({
  uncategorized: boolFromString,
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  day: z.coerce.number().int().min(1).max(31).optional(),
  meal_slot: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const assignFoodEntrySchema = z.object({
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(1).max(12),
  day: z.coerce.number().int().min(1).max(31),
  hour: z.coerce.number().int().min(0).max(23).optional(),
  meal_slot: z.enum(["breakfast", "lunch", "dinner", "snack"]).nullable().optional(),
});

export const imageOwnerKindSchema = z.enum(["journal", "food"]);

const backupImageBlobSchema = z.object({
  key: z.string().min(1),
  content_type: z.string().min(1),
  data: z.string().min(1),
});

const backupJournalEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  source: z.enum(["web", "telegram"]),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23).nullable(),
  content: z.string(),
  images: z.array(z.string()).nullable(),
  tags: z.array(z.string()).nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

const backupFoodEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  source: z.enum(["web", "telegram"]),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23).nullable(),
  meal_slot: z.enum(["breakfast", "lunch", "dinner", "snack"]).nullable(),
  assigned_at: z.string().nullable(),
  logged_at: z.string().min(1),
  content: z.string(),
  images: z.array(z.string()).nullable(),
  tags: z.array(z.string()).nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const backupPayloadSchema = z.object({
  version: z.literal(2),
  exported_at: z.string().min(1),
  journal_entries: z.array(backupJournalEntrySchema),
  food_entries: z.array(backupFoodEntrySchema),
  image_blobs: z.array(backupImageBlobSchema),
});
