import { SmsProviderNotConfiguredError, type SmsProvider } from "../sms.interface";
import type { SendSmsInput, SendSmsResult } from "../sms.types";

/**
 * Placeholder adapter for a real HTTP SMS gateway (Guinea market: Orange, MTN, ...).
 * No API is invented here — once official docs (endpoint, auth headers, payload,
 * response, delivery webhook) are provided, implement the real call using axios and
 * SMS_API_URL / SMS_API_KEY / SMS_SENDER from src/config/env.ts.
 */
export class HttpSmsProvider implements SmsProvider {
  readonly name = "http";

  async send(_input: SendSmsInput): Promise<SendSmsResult> {
    throw new SmsProviderNotConfiguredError(this.name);
  }
}
