import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../../config/env";
import { EmailProviderNotConfiguredError, type EmailProvider } from "../email.interface";
import type { SendEmailInput, SendEmailResult } from "../email.types";

/**
 * Real SMTP provider (nodemailer). Works with any standard SMTP server/provider
 * (SendGrid, Mailgun, Amazon SES, Gmail SMTP, a local relay, ...) configured entirely
 * via env vars — no vendor-specific API is hardcoded here.
 */
export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp";
  private transporter: Transporter;

  constructor() {
    if (!env.SMTP_HOST || !env.EMAIL_FROM_ADDRESS) {
      throw new EmailProviderNotConfiguredError(
        this.name,
        "SMTP_HOST and EMAIL_FROM_ADDRESS must both be set",
      );
    }
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const info = await this.transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { provider: this.name, messageId: info.messageId, status: "sent" };
  }
}
