import { z } from "zod";

export const userListQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.enum(["admin", "seller", "customer"]).optional(),
  status: z.enum(["active", "suspended", "pending"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "seller", "customer"]),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "pending"]),
});
