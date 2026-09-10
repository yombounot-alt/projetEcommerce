import { Schema, model, Types, type Document } from "mongoose";

export type OrderStatus =
  "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentMethod =
  "card" | "paypal" | "bank_transfer" | "cash_on_delivery" | "mobile_money";
export type OrderPaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";

export interface IOrderAddress {
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface IOrderItem {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  seller: Types.ObjectId;
  productName: string;
  productImage: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface IOrderPaymentSnapshot {
  payment?: Types.ObjectId;
  method: PaymentMethod;
  status: OrderPaymentStatus;
  amount: number;
  currency: string;
  processedAt?: Date;
  providerReference?: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  customer: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  items: IOrderItem[];
  status: OrderStatus;
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  shippingMethod: string;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  subtotal: number;
  total: number;
  currency: string;
  payment: IOrderPaymentSnapshot;
  notes?: string;
  cancelledReason?: string;
  ownerNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderAddressSchema = new Schema<IOrderAddress>(
  {
    label: { type: String, required: true },
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  sku: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
});

const orderPaymentSnapshotSchema = new Schema<IOrderPaymentSnapshot>(
  {
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    method: {
      type: String,
      enum: ["card", "paypal", "bank_transfer", "cash_on_delivery", "mobile_money"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "authorized", "captured", "failed", "refunded"],
      default: "pending",
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "GNF" },
    processedAt: { type: Date },
    providerReference: { type: String },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v: unknown[]) => v.length > 0, "Order must contain at least one item"],
    },
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    shippingAddress: { type: orderAddressSchema, required: true },
    billingAddress: { type: orderAddressSchema, required: true },
    shippingMethod: { type: String, required: true },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    couponCode: { type: String },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "GNF" },
    payment: { type: orderPaymentSnapshotSchema, required: true },
    notes: { type: String, maxlength: 1000 },
    cancelledReason: { type: String, maxlength: 500 },
    // Guards the owner "new order" email against duplicates (refresh, retry, repeated
    // webhook): set atomically via findOneAndUpdate before the email is sent, see
    // orderNotification.service.ts.
    ownerNotifiedAt: { type: Date },
  },
  { timestamps: true },
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ "items.seller": 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = model<IOrder>("Order", orderSchema);
