export type PaymentProviderStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";

export interface InitializePaymentInput {
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  idempotencyKey: string;
  customerEmail: string;
  customerName: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResult {
  provider: string;
  transactionId: string;
  status: PaymentProviderStatus;
  /** Present for providers that need a client-side redirect/checkout step. */
  redirectUrl?: string;
  raw?: Record<string, unknown>;
}

export interface VerifyPaymentResult {
  provider: string;
  transactionId: string;
  status: PaymentProviderStatus;
  amount: number;
  currency: string;
  paidAt?: Date;
  raw?: Record<string, unknown>;
}

export interface RefundPaymentInput {
  transactionId: string;
  amount?: number;
  reason?: string;
}

export interface RefundPaymentResult {
  provider: string;
  transactionId: string;
  refundId: string;
  status: "refunded" | "failed";
  raw?: Record<string, unknown>;
}

export interface WebhookEvent {
  eventId: string;
  transactionId: string;
  status: PaymentProviderStatus;
  amount: number;
  currency: string;
  raw: Record<string, unknown>;
}
