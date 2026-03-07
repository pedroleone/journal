import { z } from "zod";

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const createEntrySchema = z.object({
  encrypted_content: z.string().min(1),
  iv: z.string().min(1),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(1).max(12),
  day: z.coerce.number().int().min(1).max(31),
  hour: z.coerce.number().int().min(0).max(23).optional(),
});

export const updateEntrySchema = z.object({
  encrypted_content: z.string().min(1),
  iv: z.string().min(1),
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

export const createFoodEntrySchema = z.object({
  encrypted_content: z.string().min(1),
  iv: z.string().min(1),
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
