import { z } from "zod";
import { objectId } from "./common.validator";

const orderAddressSchema = z.object({
  label: z.string().trim().min(1).max(60).default("Shipping"),
  fullName: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .min(6)
    .regex(/^[0-9+\s().-]+$/, "Numéro de téléphone invalide"),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId,
        variantId: objectId.optional(),
        quantity: z.coerce.number().int().positive().max(999),
      }),
    )
    .min(1, "La commande doit contenir au moins un article"),
  shippingAddress: orderAddressSchema,
  billingAddress: orderAddressSchema.optional(),
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  couponCode: z.string().trim().toUpperCase().optional(),
  paymentMethod: z.enum(["card", "paypal", "bank_transfer", "cash_on_delivery", "mobile_money"]),
  notes: z.string().trim().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  reason: z.string().trim().max(500).optional(),
});

export const orderListQuerySchema = z.object({
  status: z
    .enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"])
    .optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});
