import { z } from "zod";

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
