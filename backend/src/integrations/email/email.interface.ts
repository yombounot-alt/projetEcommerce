import type { SendEmailInput, SendEmailResult } from "./email.types";

export interface EmailProvider {
  readonly name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

export class EmailProviderNotConfiguredError extends Error {
  constructor(provider: string, reason: string) {
    super(`Email provider "${provider}" is not configured: ${reason}`);
    this.name = "EmailProviderNotConfiguredError";
  }
}
