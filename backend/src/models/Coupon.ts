import { Schema, model, Types, type Document } from "mongoose";

export type CouponType = "percentage" | "fixed";

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal?: number;
  /** Total redemption cap across all customers. undefined = unlimited. */
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minSubtotal: { type: Number, min: 0 },
    maxUses: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

export const Coupon = model<ICoupon>("Coupon", couponSchema);
