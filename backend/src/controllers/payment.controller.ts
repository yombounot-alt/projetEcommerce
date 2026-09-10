import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { resolvePaymentProviderByName } from "../integrations/payment/payment.service";
import * as paymentService from "../services/payment.service";

export const initialize = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.initializeOrderPayment(
    req.body.orderId,
    req.user!.id,
    req.body.method,
  );
  res.status(201).json(result.payment);
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
 * Generic webhook receiver. The provider adapter (see integrations/payment/providers)
 * is responsible for verifying the signature before this ever calls applyWebhookEvent —
 * an invalid signature makes parseWebhook throw, which the errorHandler turns into 4xx.
 */
export const webhook = catchAsync(async (req: Request, res: Response) => {
  const providerName = req.params.provider;
  const provider = resolvePaymentProviderByName(providerName);
  const event = provider.parseWebhook(req.body, req.headers);
  await paymentService.applyWebhookEvent(providerName, event);
  res.status(200).json({ received: true });
});
