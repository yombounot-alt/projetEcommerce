import axios from "axios";
import { env } from "../../../config/env";
import { EmailProviderNotConfiguredError, type EmailProvider } from "../email.interface";
import type { SendEmailInput, SendEmailResult } from "../email.types";

/**
 * Resend HTTP API provider (https://resend.com/docs/api-reference/emails/send-email).
 * Preferred over SMTP whenever RESEND_API_KEY is set (see email.service.ts): the request
 * goes out over HTTPS (443), which a host that blocks outbound SMTP ports (587/465/25 —
 * confirmed on Railway) cannot interfere with.
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  constructor() {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM_ADDRESS) {
      throw new EmailProviderNotConfiguredError(
        this.name,
        "RESEND_API_KEY and EMAIL_FROM_ADDRESS must both be set",
      );
    }
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const response = await axios.post<{ id: string }>(
      "https://api.resend.com/emails",
      {
        from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      },
      {
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 8_000,
      },
    );
    return { provider: this.name, messageId: response.data.id, status: "sent" };
  }
}
