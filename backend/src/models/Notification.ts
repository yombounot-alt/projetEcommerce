import { Schema, model, Types, type Document } from "mongoose";
import { toJSONPlugin } from "../utils/toJSONPlugin";

export type NotificationType =
  "ORDER" | "PAYMENT" | "SHIPPING" | "DELIVERY" | "ACCOUNT" | "SECURITY";
export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS" | "PUSH";

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["ORDER", "PAYMENT", "SHIPPING", "DELIVERY", "ACCOUNT", "SECURITY"],
      required: true,
    },
    channel: { type: String, enum: ["IN_APP", "EMAIL", "SMS", "PUSH"], default: "IN_APP" },
    title: { type: String, required: true, maxlength: 150 },
    message: { type: String, required: true, maxlength: 1000 },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

toJSONPlugin(notificationSchema);

export const Notification = model<INotification>("Notification", notificationSchema);
