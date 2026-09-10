import { Schema, model, Types, type Document } from "mongoose";

export type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  provider: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  metadata: Record<string, unknown>;
  idempotencyKey: string;
  processedWebhookIds: string[];
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    provider: { type: String, required: true },
    transactionId: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "GNF" },
    status: {
      type: String,
      enum: ["pending", "authorized", "captured", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    method: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    idempotencyKey: { type: String, required: true, unique: true },
    processedWebhookIds: { type: [String], default: [] },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

export const Payment = model<IPayment>("Payment", paymentSchema);
