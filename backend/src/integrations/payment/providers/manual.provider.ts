import { generateSecureToken } from "../../../utils/generateCode";
import type { PaymentProvider } from "../payment.interface";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentResult,
  WebhookEvent,
} from "../payment.types";

/**
 * Real, working provider for payment methods that never touch a third-party gateway:
 * cash_on_delivery and bank_transfer. No external API — settlement is confirmed manually
 * by an admin/seller (order status transition), which is why verifyPayment/webhooks are
 * intentionally unsupported here.
 */
export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual";

  async initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    return {
      provider: this.name,
      transactionId: `manual_${generateSecureToken(12)}`,
      status: "pending",
      raw: {
        method: input.method,
        note: "Awaiting manual confirmation (cash on delivery / bank transfer).",
      },
    };
  }

  async verifyPayment(): Promise<VerifyPaymentResult> {
    throw new Error(
      "Manual payments (cash_on_delivery / bank_transfer) have no external status to verify. " +
        "Confirm settlement explicitly via PATCH /payments/:id or the order status endpoint.",
    );
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult> {
    return {
      provider: this.name,
      transactionId: input.transactionId,
      refundId: `manual_refund_${generateSecureToken(8)}`,
      status: "refunded",
      raw: { reason: input.reason ?? "Manual refund recorded by staff." },
    };
  }

  parseWebhook(): WebhookEvent {
    throw new Error("Manual payment provider does not receive webhooks.");
  }
}
