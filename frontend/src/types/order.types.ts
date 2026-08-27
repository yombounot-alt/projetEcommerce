import type { ISODateString, UUID } from "./common.types";
import type { Address } from "./user.types";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "card" | "paypal" | "bank_transfer" | "cash_on_delivery";

export type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";

export interface OrderItem {
  id: UUID;
  productId: UUID;
  productName: string;
  productImage: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Payment {
  id: UUID;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  processedAt?: ISODateString;
  /** Référence externe fournie par le prestataire de paiement (jamais de données bancaires brutes). */
  providerReference?: string;
}

export interface Order {
  id: UUID;
  orderNumber: string;
  customerId: UUID;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: string;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  subtotal: number;
  total: number;
  currency: string;
  payment: Payment;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CartItem {
  productId: UUID;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  stock: number;
}

export interface Coupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minSubtotal?: number;
  expiresAt?: ISODateString;
}
