import type {
  InitializePaymentInput,
  InitializePaymentResult,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentResult,
  WebhookEvent,
} from "./payment.types";

/**
 * Contract every payment provider adapter must satisfy. OrderService/PaymentService
 * depend only on this interface, never on a concrete provider — swapping or adding a
 * provider (Orange Money, Stripe, ...) never requires touching business logic.
 */
export interface PaymentProvider {
  readonly name: string;

  initializePayment(input: InitializePaymentInput): Promise<InitializePaymentResult>;

  verifyPayment(transactionId: string): Promise<VerifyPaymentResult>;

  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult>;

  /** Validates the raw webhook request (signature, secret) and normalizes it. */
  parseWebhook(
    rawBody: Buffer | string,
    headers: Record<string, string | string[] | undefined>,
  ): WebhookEvent;
}

export class PaymentProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(
      `Payment provider "${provider}" is not configured. Provide its official API docs ` +
        `(URL, auth, request/response shapes, webhook signature) to implement ` +
        `src/integrations/payment/providers/${provider}.provider.ts.`,
    );
    this.name = "PaymentProviderNotConfiguredError";
  }
}
