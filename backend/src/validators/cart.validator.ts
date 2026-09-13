import { z } from "zod";
import { objectId } from "./common.validator";

export const addCartItemSchema = z.object({
  productId: objectId,
  variantId: objectId.optional(),
  quantity: z.coerce.number().int().positive().max(999).default(1),
});

export const updateCartItemSchema = z.object({
  variantId: objectId.optional(),
  quantity: z.coerce.number().int().positive().max(999),
});

export const cartItemParamsSchema = z.object({
  productId: objectId,
});

export const cartItemQuerySchema = z.object({
  variantId: objectId.optional(),
});
