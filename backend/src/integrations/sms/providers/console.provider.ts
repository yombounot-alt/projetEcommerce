import { logger } from "../../../utils/logger";
import { generateSecureToken } from "../../../utils/generateCode";
import type { SmsProvider } from "../sms.interface";
import type { SendSmsInput, SendSmsResult } from "../sms.types";

/**
 * Real, working fallback provider used in development/test or whenever no real SMS
 * gateway is configured (SMS_API_URL unset). Never sends a real SMS — logs it instead,
 * so OTP flows remain fully testable end-to-end without a paid provider.
 */
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = "console";

  async send(input: SendSmsInput): Promise<SendSmsResult> {
    logger.info(`[SMS:console] to=${input.to} message="${input.message}"`);
    return { provider: this.name, messageId: `console_${generateSecureToken(8)}`, status: "sent" };
  }
}
