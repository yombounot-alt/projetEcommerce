import { PaymentProviderNotConfiguredError, type PaymentProvider } from "../payment.interface";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentResult,
  WebhookEvent,
} from "../payment.types";

/**
 * Placeholder adapter for card / mobile money / PayPal-style gateway payments.
 *
 * No real provider is wired here yet: the official API documentation (endpoint URLs,
 * auth scheme, request/response payloads, webhook signature algorithm) has not been
 * supplied. Per project rules, no API is invented. Once a Guinea-market provider's
 * docs are provided, replace the bodies below with real HTTP calls (see
 * PAYMENT_API_URL / PAYMENT_API_KEY / PAYMENT_SECRET_KEY / PAYMENT_WEBHOOK_SECRET in
 * src/config/env.ts) — the rest of the system (OrderService, PaymentService, routes)
 * requires no changes since it only depends on the PaymentProvider interface.
 */
export class GatewayPaymentProvider implements PaymentProvider {
  readonly name = "gateway";

  async initializePayment(_input: InitializePaymentInput): Promise<InitializePaymentResult> {
    throw new PaymentProviderNotConfiguredError(this.name);
  }

  async verifyPayment(_transactionId: string): Promise<VerifyPaymentResult> {
    throw new PaymentProviderNotConfiguredError(this.name);
  }

  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentResult> {
    throw new PaymentProviderNotConfiguredError(this.name);
  }

  parseWebhook(
    _rawBody: Buffer | string,
    _headers: Record<string, string | string[] | undefined>,
  ): WebhookEvent {
    throw new PaymentProviderNotConfiguredError(this.name);
  }
}
