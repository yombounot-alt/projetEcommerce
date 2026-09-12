import { PaymentWebhookLog } from "../models/PaymentWebhookLog";
import { logger } from "../utils/logger";

interface RecordWebhookLogInput {
  provider: string;
  transactionId?: string;
  outcome: "accepted" | "rejected" | "error";
  errorMessage?: string;
  headers: Record<string, unknown>;
  rawBody: string;
}

/**
 * Fire-and-forget durable log of an inbound payment webhook request, valid or not.
 * Never throws into the caller's flow — see audit.service.ts for the same pattern.
 */
export async function recordWebhookLog(input: RecordWebhookLogInput): Promise<void> {
  try {
    await PaymentWebhookLog.create({
      provider: input.provider,
      transactionId: input.transactionId,
      outcome: input.outcome,
      errorMessage: input.errorMessage,
      headers: input.headers,
      rawBody: input.rawBody,
    });
  } catch (error) {
    logger.error("Failed to record payment webhook log", { provider: input.provider, error });
  }
}
