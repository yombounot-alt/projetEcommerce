import type { PaymentProvider } from "./payment.interface";
import { ManualPaymentProvider } from "./providers/manual.provider";
import { GatewayPaymentProvider } from "./providers/gateway.provider";
import { ChapchaPayProvider } from "./providers/chapchapay.provider";

const MANUAL_METHODS = new Set(["cash_on_delivery", "bank_transfer"]);
// card / mobile_money (Orange Money, MTN MoMo, PayCard...) are handled by ChapchaPay.
// Any other method (e.g. paypal) falls back to the unconfigured gateway placeholder.
const CHAPCHAPAY_METHODS = new Set(["card", "mobile_money"]);

const manualProvider = new ManualPaymentProvider();
const gatewayProvider = new GatewayPaymentProvider();
const chapchapayProvider = new ChapchaPayProvider();

/**
 * Resolves the correct PaymentProvider adapter for a payment method. This is the only
 * place in the codebase that knows about concrete providers — everything else (OrderService,
 * controllers) talks to the PaymentProvider interface.
 */
export function resolvePaymentProvider(method: string): PaymentProvider {
  if (MANUAL_METHODS.has(method)) {
    return manualProvider;
  }
  if (CHAPCHAPAY_METHODS.has(method)) {
    return chapchapayProvider;
  }
  return gatewayProvider;
}

export function resolvePaymentProviderByName(name: string): PaymentProvider {
  if (name === manualProvider.name) return manualProvider;
  if (name === chapchapayProvider.name) return chapchapayProvider;
  return gatewayProvider;
}

/**
 * Manual methods (cash on delivery, bank transfer) never reach "captured" through an
 * online gateway — settlement is confirmed by staff after the fact. Used by
 * order.service.ts to decide whether the owner notification fires at order creation
 * (manual methods) or has to wait for payment capture (gateway methods).
 */
export function isManualPaymentMethod(method: string): boolean {
  return MANUAL_METHODS.has(method);
}
