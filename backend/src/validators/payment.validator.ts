import { z } from "zod";
import { objectId } from "./common.validator";

export const initializePaymentSchema = z.object({
  orderId: objectId,
  method: z.enum(["card", "paypal", "bank_transfer", "cash_on_delivery", "mobile_money"]),
});

export const refundPaymentSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  reason: z.string().trim().max(500).optional(),
});

export const reconcilePaymentSchema = z.object({
  status: z.enum(["captured", "failed"]),
  reason: z.string().trim().max(500).optional(),
});

/**
 * Generic webhook envelope. Real provider payloads are provider-specific and are
 * normalized inside integrations/payment/providers/*; this only validates the shape
 * required to route + verify the event before it reaches the provider adapter.
 */
export const webhookEnvelopeSchema = z.object({
  eventId: z.string().min(1),
  transactionId: z.string().min(1),
  status: z.enum(["authorized", "captured", "failed", "refunded"]),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3),
});
