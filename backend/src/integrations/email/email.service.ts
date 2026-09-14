import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import type { EmailProvider } from "./email.interface";
import type { SendEmailInput, SendEmailResult } from "./email.types";
import { ConsoleEmailProvider } from "./providers/console.provider";
import { ResendEmailProvider } from "./providers/resend.provider";
import { SmtpEmailProvider } from "./providers/smtp.provider";

function resolveEmailProvider(): EmailProvider {
  if (env.RESEND_API_KEY) return new ResendEmailProvider();
  return env.SMTP_HOST ? new SmtpEmailProvider() : new ConsoleEmailProvider();
}

const provider = resolveEmailProvider();

const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 200;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends an email through the configured provider, retrying transient failures (network
 * blip, SMTP server momentarily unavailable) with a short exponential backoff. Never
 * masks a definitive failure: after the last attempt it lets the error propagate so the
 * caller decides how to handle/log it (callers that must not fail their own flow, like
 * order notifications, wrap this in their own try/catch — see orderNotification.service.ts).
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await provider.send(input);
    } catch (error) {
      lastError = error;
      logger.warn(`[EMAIL:${provider.name}] send attempt ${attempt}/${RETRY_ATTEMPTS} failed`, {
        to: input.to,
        subject: input.subject,
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt < RETRY_ATTEMPTS) {
        await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}
