import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    storeName: z.string().trim().min(2).max(100).optional(),
    supportEmail: z.string().trim().email().optional(),
  })
  .strict();
