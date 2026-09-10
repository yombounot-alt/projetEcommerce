import { z } from "zod";
import { objectId } from "./common.validator";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des minuscules, chiffres et tirets")
    .optional(),
  description: z.string().trim().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  parentId: objectId.nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createBrandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  logoUrl: z.string().url().optional(),
});
