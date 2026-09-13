import { z } from "zod";

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code trop court (3 caractères minimum)")
      .max(32, "Code trop long (32 caractères maximum)")
      .toUpperCase(),
    type: z.enum(["percentage", "fixed"], { message: "Type requis" }),
    value: z.coerce.number().positive("La valeur doit être positive"),
    minSubtotal: z.coerce.number().min(0).optional(),
    maxUses: z.coerce.number().int().positive().optional(),
    isActive: z.boolean(),
    expiresAt: z.string().optional(),
  })
  .refine((data) => data.type !== "percentage" || data.value <= 100, {
    message: "Une remise en pourcentage ne peut pas dépasser 100",
    path: ["value"],
  });

export type CouponFormValues = z.infer<typeof couponFormSchema>;
