import { Order, type IOrder } from "../models/Order";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { sendEmail } from "../integrations/email/email.service";
import { buildOwnerNewOrderEmail } from "../integrations/email/templates/ownerNewOrder.template";

/**
 * Notifies the store owner by email that a new order has been successfully placed (and,
 * for online payment methods, that payment was confirmed — see call sites in
 * order.service.ts / payment.service.ts). Deliberately isolated from the checkout/payment
 * transaction: this must never affect order creation or payment processing.
 *
 * Idempotency: `ownerNotifiedAt` is claimed with a single atomic findOneAndUpdate before
 * sending. Only the caller that flips it from unset to set proceeds to send — a page
 * refresh, a client retry, or a webhook redelivered for the same order can never trigger
 * a second email, even under concurrent calls. The claim is kept even if the send itself
 * ultimately fails (after email.service.ts's own retries) — favoring "never a duplicate"
 * over "guaranteed eventual delivery"; a failed send is logged with the order id so it can
 * be resent manually if needed.
 */
export async function notifyOwnerNewOrder(order: IOrder): Promise<void> {
  if (!env.OWNER_NOTIFICATION_EMAIL) {
    logger.warn(
      "OWNER_NOTIFICATION_EMAIL is not configured — skipping owner new-order notification",
      { orderId: String(order._id), orderNumber: order.orderNumber },
    );
    return;
  }

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, ownerNotifiedAt: { $exists: false } },
    { ownerNotifiedAt: new Date() },
  );
  if (!claimed) {
    return; // already notified (or lost the race to a concurrent call) — no-op
  }

  try {
    const { subject, html, text } = buildOwnerNewOrderEmail(order);
    await sendEmail({ to: env.OWNER_NOTIFICATION_EMAIL, subject, html, text });
    logger.info("Owner new-order notification sent", {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    logger.error("Failed to send owner new-order notification", {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
