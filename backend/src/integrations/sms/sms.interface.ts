import type { SendSmsInput, SendSmsResult } from "./sms.types";

export interface SmsProvider {
  readonly name: string;
  send(input: SendSmsInput): Promise<SendSmsResult>;
}

export class SmsProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(
      `SMS provider "${provider}" is not configured. Provide its official API docs ` +
        `(URL, auth, request/response shape) to implement src/integrations/sms/providers/${provider}.provider.ts.`,
    );
    this.name = "SmsProviderNotConfiguredError";
  }
}
