import { Router } from "express";
import { z } from "zod";
import * as paymentController from "../controllers/payment.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { paymentLimiter } from "../middlewares/rateLimiters";
import { initializePaymentSchema, refundPaymentSchema } from "../validators/payment.validator";
import { idParam } from "../validators/common.validator";

const router = Router();
const providerParam = z.object({ provider: z.string().min(1) });

// Mounted with express.raw() upstream in app.ts so the provider adapter can verify the
// raw signature before JSON parsing — see PaymentProvider.parseWebhook.
router.post(
  "/webhook/:provider",
  paymentLimiter,
  validate({ params: providerParam }),
  paymentController.webhook,
);

/**
 * @openapi
 * /payments/initialize:
 *   post:
 *     tags: [Payments]
 *     summary: Initialize payment for a pending order
 *     description: >
 *       Idempotent per order — retrying reuses the existing pending Payment record.
 *       `cash_on_delivery`/`bank_transfer` succeed immediately (manual settlement);
 *       other methods return 503 until a real gateway provider is configured.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: { type: string }
 *               method: { type: string, enum: [card, paypal, bank_transfer, cash_on_delivery, mobile_money] }
 *     responses:
 *       201: { description: Payment initialized }
 *       403: { description: Order does not belong to the caller }
 *       503: { description: Payment method not yet available }
 */
router.post(
  "/initialize",
  authenticate,
  authorize("customer"),
  paymentLimiter,
  validate({ body: initializePaymentSchema }),
  paymentController.initialize,
);
router.get("/:id", authenticate, validate({ params: idParam }), paymentController.getById);
router.post(
  "/:id/refund",
  authenticate,
  authorize("admin"),
  validate({ params: idParam, body: refundPaymentSchema }),
  paymentController.refund,
);

export default router;
