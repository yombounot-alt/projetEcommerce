// Mirrors frontend/src/constants/app.constants.ts so quoted shipping/coupon behavior
// stays identical between the mocked and the real backend during the migration.
// Amounts are in GNF (Guinean Franc has no minor unit, unlike the placeholder USD-style
// decimals this used to hold) and scaled to the seeded catalogue (60 000 - 2 500 000 GNF
// per product, see scripts/seed.ts) — the old 75/4.99/9.99 values made every real order
// qualify for free shipping, silently disabling the standard/express cost entirely.
export const FREE_SHIPPING_THRESHOLD = 500_000;
export const STANDARD_SHIPPING_COST = 20_000;
export const EXPRESS_SHIPPING_COST = 40_000;

export interface Coupon {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minSubtotal?: number;
}

// Same demo coupons as frontend/src/api/services/order.service.ts's mock implementation.
export const KNOWN_COUPONS: Coupon[] = [
  { code: "WELCOME10", type: "percentage", value: 10 },
  { code: "FREESHIP", type: "fixed", value: STANDARD_SHIPPING_COST },
];

export function computeShippingCost(method: "standard" | "express", subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return method === "express" ? EXPRESS_SHIPPING_COST : STANDARD_SHIPPING_COST;
}

export function computeDiscount(coupon: Coupon | undefined, subtotal: number): number {
  if (!coupon) return 0;
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return 0;
  const discount = coupon.type === "percentage" ? subtotal * (coupon.value / 100) : coupon.value;
  return Number(Math.min(discount, subtotal).toFixed(2));
}
