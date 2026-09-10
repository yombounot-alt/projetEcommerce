import { logger } from "../../../utils/logger";
import { generateSecureToken } from "../../../utils/generateCode";
import type { EmailProvider } from "../email.interface";
import type { SendEmailInput, SendEmailResult } from "../email.types";

/**
 * Real, working fallback provider used in development/test or whenever no real SMTP
 * server is configured (SMTP_HOST unset). Never sends a real email — logs it instead
 * (subject/recipient only, never the HTML body, to keep logs readable and avoid dumping
 * customer PII into log storage), so email-dependent flows remain testable end-to-end
 * without a paid provider. Mirrors integrations/sms/providers/console.provider.ts.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    logger.info(`[EMAIL:console] to=${input.to} subject="${input.subject}"`);
    return { provider: this.name, messageId: `console_${generateSecureToken(8)}`, status: "sent" };
  }
}
