export interface SendSmsInput {
  to: string;
  message: string;
}

export interface SendSmsResult {
  provider: string;
  messageId: string;
  status: "queued" | "sent" | "failed";
}
