import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { resolvePaymentProviderByName } from "../integrations/payment/payment.service";
import * as paymentService from "../services/payment.service";
import { recordWebhookLog } from "../services/webhookLog.service";

export const initialize = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.initializeOrderPayment(
    req.body.orderId,
    req.user!.id,
    req.body.method,
  );
  // redirectUrl is present for gateway methods (ChapchaPay) — the frontend must send the
  // customer there to complete payment; it is absent for manual methods.
  res.status(201).json({ ...result.payment, redirectUrl: result.redirectUrl });
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentById(req.params.id, req.user!);
  res.status(200).json(payment);
});

export const refund = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.refundPayment(
    req.params.id,
    req.user!,
    req.body.amount,
    req.body.reason,
  );
  res.status(200).json(result.payment);
});

/**
 * Manual override for a payment stuck "pending" with no incoming webhook — the admin has
 * independently verified the real outcome in the provider's dashboard. See
 * payment.service.ts#reconcilePayment for the guardrails (only from "pending").
 */
export const reconcile = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.reconcilePayment(
    req.params.id,
    req.user!,
    req.body.status,
    req.body.reason,
  );
  res.status(200).json(result.payment);
});

/**
 * Generic webhook receiver. The provider adapter (see integrations/payment/providers)
 * is responsible for verifying the signature before this ever calls applyWebhookEvent —
 * an invalid signature makes parseWebhook throw, which the errorHandler turns into 4xx.
 */
export const webhook = catchAsync(async (req: Request, res: Response) => {
  const providerName = req.params.provider;
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
  const provider = resolvePaymentProviderByName(providerName);

  let event;
  try {
    event = provider.parseWebhook(req.body, req.headers);
  } catch (error) {
    await recordWebhookLog({
      provider: providerName,
      outcome: "rejected",
      errorMessage: error instanceof Error ? error.message : String(error),
      headers: req.headers,
      rawBody,
    });
    throw error;
  }

  try {
    await paymentService.applyWebhookEvent(providerName, event);
  } catch (error) {
    await recordWebhookLog({
      provider: providerName,
      transactionId: event.transactionId,
      outcome: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
      headers: req.headers,
      rawBody,
    });
    throw error;
  }

  await recordWebhookLog({
    provider: providerName,
    transactionId: event.transactionId,
    outcome: "accepted",
    headers: req.headers,
    rawBody,
  });

  res.status(200).json({ received: true });
});
