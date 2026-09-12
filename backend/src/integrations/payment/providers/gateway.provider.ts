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
 * The Guinea-market gateway is now handled by ChapchaPayProvider (see
 * providers/chapchapay.provider.ts) for the "card" and "mobile_money" methods.
 * This placeholder remains the fallback for any other method (e.g. "paypal") that has
 * no configured provider yet — per project rules, no API is invented for those until
 * their official docs are supplied. The rest of the system (OrderService, PaymentService,
 * routes) requires no changes to add one since it only depends on the PaymentProvider
 * interface.
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
