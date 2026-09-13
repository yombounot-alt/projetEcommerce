import mongoose from "mongoose";
import { Payment, type IPayment } from "../models/Payment";
import { Order, type IOrder } from "../models/Order";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "../utils/AppError";
import { generateSecureToken } from "../utils/generateCode";
import {
  resolvePaymentProvider,
  resolvePaymentProviderByName,
} from "../integrations/payment/payment.service";
import { PaymentProviderNotConfiguredError } from "../integrations/payment/payment.interface";
import type { WebhookEvent } from "../integrations/payment/payment.types";
import { confirmStockSale, releaseStock } from "./stock.service";
import { createNotification } from "./notification.service";
import { recordAudit } from "./audit.service";
import { notifyOwnerNewOrder, notifyCustomerOrderConfirmed } from "./orderNotification.service";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import type { Role } from "../utils/jwt";

const MANUAL_METHODS = new Set(["cash_on_delivery", "bank_transfer"]);

/**
 * Applies a "captured" transition: marks the payment paid, confirms reserved stock as
 * sold, and notifies the customer. Shared by the webhook path, manual admin reconciliation,
 * and (indirectly, by NOT calling this) the late-capture-after-cancellation safety branch.
 */
async function applyCapturedTransition(payment: IPayment, order: IOrder): Promise<void> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      payment.status = "captured";
      payment.paidAt = new Date();
      await payment.save({ session });

      order.payment.status = "captured";
      order.payment.providerReference = payment.transactionId;
      order.status = "paid";
      order.payment.processedAt = new Date();
      await order.save({ session });

      for (const item of order.items) {
        await confirmStockSale(
          String(item.product),
          item.quantity,
          { reason: "Payment captured", orderId: String(order._id), session },
          item.variant ? String(item.variant) : undefined,
        );
      }
    });
  } finally {
    await session.endSession();
  }

  await createNotification({
    userId: String(order.customer),
    type: "PAYMENT",
    title: "Paiement reçu",
    message: `Le paiement de la commande ${order.orderNumber} a été confirmé.`,
    metadata: { orderId: String(order._id) },
  });

  await notifyOwnerNewOrder(order);
  await notifyCustomerOrderConfirmed(order);
}

/**
 * Applies a "failed" transition: cancels the order and releases reserved stock back to
 * available. Shared by the webhook path, manual admin reconciliation, and the pending-payment
 * expiry job.
 */
async function applyFailedTransition(
  payment: IPayment,
  order: IOrder,
  reason: string,
): Promise<void> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      payment.status = "failed";
      await payment.save({ session });

      order.payment.status = "failed";
      order.status = "cancelled";
      order.cancelledReason = reason;
      await order.save({ session });

      for (const item of order.items) {
        await releaseStock(
          String(item.product),
          item.quantity,
          { reason, orderId: String(order._id), session },
          item.variant ? String(item.variant) : undefined,
        );
      }
    });
  } finally {
    await session.endSession();
  }

  await createNotification({
    userId: String(order.customer),
    type: "PAYMENT",
    title: "Échec du paiement",
    message: `Le paiement de la commande ${order.orderNumber} n'a pas pu être traité.`,
    metadata: { orderId: String(order._id) },
  });
}

function toPaymentDTO(payment: IPayment) {
  return {
    id: String(payment._id),
    order: String(payment.order),
    provider: payment.provider,
    transactionId: payment.transactionId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    metadata: payment.metadata,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

/**
 * Initializes payment for an order. Idempotent per order: retrying after a transient
 * failure reuses the existing pending Payment record instead of creating a duplicate.
 */
export async function initializeOrderPayment(
  orderId: string,
  actorId: string,
  methodOverride?: string,
) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Commande introuvable", "ORDER_NOT_FOUND");
  if (String(order.customer) !== actorId) {
    throw new ForbiddenError("Vous n'avez pas accès à cette commande", "ORDER_ACCESS_DENIED");
  }
  if (order.status !== "pending") {
    throw new ConflictError(
      `La commande est déjà au statut "${order.status}"`,
      "ORDER_NOT_PAYABLE",
    );
  }

  const existing = await Payment.findOne({ order: order._id });
  if (existing && existing.status === "captured") {
    throw new ConflictError("Cette commande a déjà été payée", "ORDER_ALREADY_PAID");
  }

  if (methodOverride && methodOverride !== order.payment.method) {
    order.payment.method = methodOverride as typeof order.payment.method;
  }

  const provider = resolvePaymentProvider(order.payment.method);
  const idempotencyKey = existing
    ? existing.idempotencyKey
    : `order:${order._id}:${generateSecureToken(8)}`;

  try {
    const result = await provider.initializePayment({
      orderId: String(order._id),
      amount: order.total,
      currency: order.currency,
      method: order.payment.method,
      idempotencyKey,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
    });

    const payment =
      existing ??
      new Payment({
        order: order._id,
        provider: result.provider,
        transactionId: result.transactionId,
        amount: order.total,
        currency: order.currency,
        method: order.payment.method,
        idempotencyKey,
      });

    payment.transactionId = result.transactionId;
    payment.status = result.status;
    if (result.status === "captured") payment.paidAt = new Date();
    await payment.save();

    order.payment.payment = payment._id;
    order.payment.status = result.status;
    order.payment.providerReference = result.transactionId;
    if (result.status === "captured") {
      order.payment.processedAt = new Date();
      order.status = "paid";
      for (const item of order.items) {
        await confirmStockSale(
          String(item.product),
          item.quantity,
          { reason: "Payment captured", orderId: String(order._id) },
          item.variant ? String(item.variant) : undefined,
        );
      }
    }
    await order.save();

    if (result.status === "captured") {
      await notifyOwnerNewOrder(order);
      await notifyCustomerOrderConfirmed(order);
    }

    await recordAudit({
      actorId,
      action: "PAYMENT_INITIALIZED",
      resource: "Payment",
      resourceId: String(payment._id),
      metadata: { orderId: String(order._id), provider: result.provider, status: result.status },
    });

    return { payment: toPaymentDTO(payment), redirectUrl: result.redirectUrl };
  } catch (error) {
    if (error instanceof PaymentProviderNotConfiguredError) {
      throw new ServiceUnavailableError(
        `Le mode de paiement "${order.payment.method}" n'est pas encore disponible. Veuillez choisir "cash_on_delivery" ou "bank_transfer", ou réessayer plus tard.`,
        "PAYMENT_METHOD_UNAVAILABLE",
      );
    }
    throw error;
  }
}

export async function getPaymentById(paymentId: string, actor: { id: string; role: Role }) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new NotFoundError("Paiement introuvable", "PAYMENT_NOT_FOUND");

  if (actor.role !== "admin") {
    const order = await Order.findById(payment.order);
    const isOwner = order && String(order.customer) === actor.id;
    const isSeller =
      order && actor.role === "seller" && order.items.some((i) => String(i.seller) === actor.id);
    if (!isOwner && !isSeller) {
      throw new ForbiddenError("Vous n'avez pas accès à ce paiement", "PAYMENT_ACCESS_DENIED");
    }
  }

  return toPaymentDTO(payment);
}

/**
 * Applies a webhook event. Idempotent: an event whose eventId was already processed for
 * this payment is a no-op, so a webhook delivered twice never double-confirms stock or
 * double-marks an order as paid (rule 21).
 */
export async function applyWebhookEvent(providerName: string, event: WebhookEvent): Promise<void> {
  const payment = await Payment.findOne({ transactionId: event.transactionId });
  if (!payment) {
    throw new NotFoundError(
      `Aucun paiement trouvé pour la transaction ${event.transactionId}`,
      "PAYMENT_NOT_FOUND",
    );
  }

  if (payment.processedWebhookIds.includes(event.eventId)) {
    return; // already processed — idempotent no-op
  }

  const order = await Order.findById(payment.order);
  if (!order) {
    throw new NotFoundError("Commande introuvable pour ce paiement", "ORDER_NOT_FOUND");
  }

  payment.processedWebhookIds.push(event.eventId);
  await payment.save();

  if (event.status === "captured" && order.status === "pending") {
    await applyCapturedTransition(payment, order);
  } else if (event.status === "failed" && order.status === "pending") {
    await applyFailedTransition(payment, order, "Échec du paiement");
  } else if (event.status === "refunded") {
    order.payment.status = "refunded";
    order.status = "refunded";
    await order.save();
  } else if (event.status === "captured" && order.status !== "paid") {
    // The order was already resolved otherwise (cancelled by a prior failed webhook, or by
    // the pending-payment expiry job) before this "captured" event arrived — most likely a
    // late/delayed webhook. Reserved stock may already have been released and resold, so we
    // must NOT silently re-confirm the sale. Record the truth on the payment and raise this
    // loudly for manual reconciliation (see reconcilePayment) instead of guessing.
    payment.status = "captured";
    payment.paidAt = new Date();
    payment.metadata = { ...payment.metadata, lateCaptureAfterResolution: true };
    await payment.save();
    logger.error("Payment captured via webhook after its order was already resolved otherwise", {
      paymentId: String(payment._id),
      orderId: String(order._id),
      orderStatus: order.status,
    });
    await recordAudit({
      action: "PAYMENT_CAPTURED_AFTER_ORDER_RESOLVED",
      resource: "Payment",
      resourceId: String(payment._id),
      metadata: { provider: providerName, eventId: event.eventId, orderStatus: order.status },
    });
    return;
  }

  await recordAudit({
    action: "PAYMENT_WEBHOOK_PROCESSED",
    resource: "Payment",
    resourceId: String(payment._id),
    metadata: { provider: providerName, eventId: event.eventId, status: event.status },
  });
}

/**
 * Admin-only manual override for when a payment is stuck "pending" with no incoming webhook
 * (e.g. provider-side webhook delivery issue) and the admin has independently verified the
 * real outcome in the provider's own dashboard. Only allowed from "pending" — a payment
 * already in a terminal state must go through refundPayment instead, never be overwritten
 * here (rule: no arbitrary SUCCESS -> PENDING-style transitions).
 */
export async function reconcilePayment(
  paymentId: string,
  actor: { id: string; role: Role },
  targetStatus: "captured" | "failed",
  reason?: string,
) {
  if (actor.role !== "admin") {
    throw new ForbiddenError(
      "Seuls les administrateurs peuvent réconcilier un paiement",
      "RECONCILE_FORBIDDEN",
    );
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new NotFoundError("Paiement introuvable", "PAYMENT_NOT_FOUND");
  if (payment.status !== "pending") {
    throw new ConflictError(
      `Ce paiement est déjà au statut "${payment.status}" — utilisez le remboursement si nécessaire`,
      "PAYMENT_NOT_PENDING",
    );
  }

  const order = await Order.findById(payment.order);
  if (!order) throw new NotFoundError("Commande introuvable pour ce paiement", "ORDER_NOT_FOUND");
  if (order.status !== "pending") {
    throw new ConflictError(
      `La commande est déjà au statut "${order.status}"`,
      "ORDER_NOT_PENDING",
    );
  }

  payment.processedWebhookIds.push(`manual:${actor.id}:${Date.now()}`);
  await payment.save();

  if (targetStatus === "captured") {
    await applyCapturedTransition(payment, order);
  } else {
    await applyFailedTransition(
      payment,
      order,
      reason ?? "Paiement réconcilié manuellement comme échoué",
    );
  }

  await recordAudit({
    actorId: actor.id,
    action: "PAYMENT_MANUALLY_RECONCILED",
    resource: "Payment",
    resourceId: String(payment._id),
    metadata: { targetStatus, reason },
  });

  return { payment: toPaymentDTO(payment) };
}

/**
 * Safety net for gateway payments (ChapchaPay...) that never receive a confirming webhook:
 * past PAYMENT_PENDING_TIMEOUT_MINUTES, treat them as failed, release reserved stock, and
 * notify the customer to retry. Never applies to manual methods (cash_on_delivery/
 * bank_transfer), which are legitimately "pending" until an admin settles them by hand.
 * Intended to be called on a recurring interval — see server.ts.
 */
export async function expirePendingPayments(): Promise<number> {
  const cutoff = new Date(Date.now() - env.PAYMENT_PENDING_TIMEOUT_MINUTES * 60_000);
  const stalePayments = await Payment.find({
    status: "pending",
    createdAt: { $lt: cutoff },
    method: { $nin: [...MANUAL_METHODS] },
  });

  let expiredCount = 0;
  for (const payment of stalePayments) {
    const order = await Order.findById(payment.order);
    if (!order || order.status !== "pending") continue; // already resolved otherwise

    try {
      await applyFailedTransition(
        payment,
        order,
        `Paiement expiré : aucune confirmation reçue après ${env.PAYMENT_PENDING_TIMEOUT_MINUTES} minutes`,
      );
      await recordAudit({
        action: "PAYMENT_EXPIRED",
        resource: "Payment",
        resourceId: String(payment._id),
        metadata: {
          orderId: String(order._id),
          timeoutMinutes: env.PAYMENT_PENDING_TIMEOUT_MINUTES,
        },
      });
      expiredCount++;
    } catch (error) {
      logger.error("Failed to expire stale pending payment", {
        paymentId: String(payment._id),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return expiredCount;
}

export async function refundPayment(
  paymentId: string,
  actor: { id: string; role: Role },
  amount?: number,
  reason?: string,
) {
  if (actor.role !== "admin") {
    throw new ForbiddenError(
      "Seuls les administrateurs peuvent émettre des remboursements",
      "REFUND_FORBIDDEN",
    );
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new NotFoundError("Paiement introuvable", "PAYMENT_NOT_FOUND");
  if (payment.status !== "captured") {
    throw new BadRequestError(
      "Seuls les paiements capturés peuvent être remboursés",
      "PAYMENT_NOT_REFUNDABLE",
    );
  }

  const provider = resolvePaymentProviderByName(payment.provider);
  const result = await provider.refundPayment({
    transactionId: payment.transactionId,
    amount,
    reason,
  });

  payment.status = "refunded";
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.status = "refunded";
    order.payment.status = "refunded";
    await order.save();
    await createNotification({
      userId: String(order.customer),
      type: "PAYMENT",
      title: "Remboursement émis",
      message: `Votre paiement pour la commande ${order.orderNumber} a été remboursé.`,
      metadata: { orderId: String(order._id) },
    });
  }

  await recordAudit({
    actorId: actor.id,
    action: "PAYMENT_REFUNDED",
    resource: "Payment",
    resourceId: String(payment._id),
    metadata: { reason },
  });

  return { payment: toPaymentDTO(payment), refundId: result.refundId };
}

export { toPaymentDTO };
