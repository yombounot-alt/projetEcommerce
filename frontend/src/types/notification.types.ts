import type { ISODateString, UUID } from "./common.types";

export type NotificationType = "ORDER" | "PAYMENT" | "SHIPPING" | "DELIVERY" | "ACCOUNT" | "SECURITY";

export interface AppNotification {
  id: UUID;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: ISODateString;
}
