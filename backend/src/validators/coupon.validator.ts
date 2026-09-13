import { z } from "zod";

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1).toUpperCase(),
  subtotal: z.coerce.number().min(0),
});

const baseCouponFields = {
  code: z.string().trim().min(3).max(32),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive(),
  minSubtotal: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
};

export const createCouponSchema = z
  .object(baseCouponFields)
  .refine((data) => data.type !== "percentage" || data.value <= 100, {
    message: "Une remise en pourcentage ne peut pas dépasser 100",
    path: ["value"],
  });

export const updateCouponSchema = z
  .object({
    code: baseCouponFields.code.optional(),
    type: baseCouponFields.type.optional(),
    value: baseCouponFields.value.optional(),
    minSubtotal: baseCouponFields.minSubtotal,
    maxUses: baseCouponFields.maxUses,
    isActive: baseCouponFields.isActive,
    expiresAt: baseCouponFields.expiresAt,
  })
  .refine((data) => data.type !== "percentage" || data.value === undefined || data.value <= 100, {
    message: "Une remise en pourcentage ne peut pas dépasser 100",
    path: ["value"],
  });
