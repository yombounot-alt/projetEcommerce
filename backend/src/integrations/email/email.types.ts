export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  provider: string;
  messageId: string;
  status: "sent" | "failed";
}
