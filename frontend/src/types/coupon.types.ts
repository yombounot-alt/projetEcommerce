export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  minSubtotal?: number;
  maxUses?: number;
  isActive?: boolean;
  expiresAt?: string;
}
