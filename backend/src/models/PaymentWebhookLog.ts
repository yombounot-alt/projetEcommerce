import { Schema, model, Types, type Document } from "mongoose";

/**
 * Durable record of every inbound payment webhook request, valid or not. This is the
 * permanent replacement for a debug log file: it lets support/ops answer "did the
 * provider ever call us for this operation?" without needing server log access, and
 * survives restarts/redeploys.
 */
export interface IPaymentWebhookLog extends Document {
  _id: Types.ObjectId;
  provider: string;
  transactionId?: string;
  outcome: "accepted" | "rejected" | "error";
  errorMessage?: string;
  headers: Record<string, unknown>;
  rawBody: string;
  createdAt: Date;
}

const paymentWebhookLogSchema = new Schema<IPaymentWebhookLog>(
  {
    provider: { type: String, required: true, index: true },
    transactionId: { type: String, index: true },
    outcome: { type: String, enum: ["accepted", "rejected", "error"], required: true },
    errorMessage: { type: String },
    headers: { type: Schema.Types.Mixed, default: {} },
    rawBody: { type: String, required: true, maxlength: 20_000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

paymentWebhookLogSchema.index({ createdAt: -1 });

export const PaymentWebhookLog = model<IPaymentWebhookLog>(
  "PaymentWebhookLog",
  paymentWebhookLogSchema,
);
