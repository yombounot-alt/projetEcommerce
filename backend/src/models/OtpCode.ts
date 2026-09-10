import { Schema, model, Types, type Document } from "mongoose";

export type OtpPurpose =
  "PHONE_VERIFICATION" | "EMAIL_VERIFICATION" | "PASSWORD_RESET" | "ORDER_CONFIRMATION";

export interface IOtpCode extends Document {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  destination: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  consumed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpCodeSchema = new Schema<IOtpCode>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    destination: { type: String, required: true, index: true },
    purpose: {
      type: String,
      enum: ["PHONE_VERIFICATION", "EMAIL_VERIFICATION", "PASSWORD_RESET", "ORDER_CONFIRMATION"],
      required: true,
    },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    consumed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCode = model<IOtpCode>("OtpCode", otpCodeSchema);
