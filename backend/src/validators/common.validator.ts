import { z } from "zod";
import mongoose from "mongoose";

export const objectId = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Identifiant invalide",
});

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const idParam = z.object({ id: objectId });
export const slugParam = z.object({ slug: z.string().min(1) });
