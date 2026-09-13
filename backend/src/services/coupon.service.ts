import type { ClientSession } from "mongoose";
import { Coupon, type ICoupon, type CouponType } from "../models/Coupon";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/AppError";
import { buildPaginatedResult, normalizePagination } from "../utils/pagination";

export interface CreateCouponInput {
  code: string;
  type: CouponType;
  value: number;
  minSubtotal?: number;
  maxUses?: number;
  isActive?: boolean;
  expiresAt?: string;
}

export type UpdateCouponInput = Partial<CreateCouponInput>;

function toCouponDTO(coupon: ICoupon) {
  return {
    id: String(coupon._id),
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minSubtotal: coupon.minSubtotal,
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    isActive: coupon.isActive,
    expiresAt: coupon.expiresAt,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

/**
 * Looks up a coupon by code and validates it's actually usable right now (active, not
 * expired, not over its redemption cap, subtotal meets the minimum) — used both for the
 * customer-facing preview (/coupons/apply) and at real checkout (order.service.ts), so a
 * coupon can never be applied to an order after it was deactivated/expired/exhausted
 * between the preview and the actual purchase.
 */
export async function validateCoupon(code: string, subtotal: number): Promise<ICoupon> {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) {
    throw new BadRequestError("Code promo invalide ou expiré", "INVALID_COUPON");
  }
  if (!coupon.isActive) {
    throw new BadRequestError("Ce code promo n'est plus actif", "COUPON_INACTIVE");
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new BadRequestError("Ce code promo a expiré", "COUPON_EXPIRED");
  }
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    throw new BadRequestError(
      "Ce code promo a atteint sa limite d'utilisation",
      "COUPON_EXHAUSTED",
    );
  }
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    throw new BadRequestError(
      `Ce code promo nécessite un sous-total minimum de ${coupon.minSubtotal}`,
      "COUPON_MIN_SUBTOTAL",
    );
  }
  return coupon;
}

/**
 * Atomically claims one redemption — the maxUses check is re-verified as part of the same
 * update (via $expr) so two concurrent checkouts can never both succeed past the cap, the
 * same anti-oversell pattern as stock.service.ts#reserveStock. Called once an order is
 * actually created with this coupon, never at mere preview time.
 */
export async function incrementCouponUsage(code: string, session?: ClientSession): Promise<void> {
  await Coupon.updateOne(
    {
      code: code.toUpperCase(),
      $or: [{ maxUses: { $exists: false } }, { $expr: { $lt: ["$usedCount", "$maxUses"] } }],
    },
    { $inc: { usedCount: 1 } },
    { session },
  );
}

export async function applyCouponPreview(code: string, subtotal: number) {
  const coupon = await validateCoupon(code, subtotal);
  return toCouponDTO(coupon);
}

export async function listCoupons(page?: number, pageSize?: number) {
  const { page: p, pageSize: ps, skip } = normalizePagination(page, pageSize);
  const [items, totalItems] = await Promise.all([
    Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(ps),
    Coupon.countDocuments(),
  ]);
  return buildPaginatedResult(items.map(toCouponDTO), totalItems, p, ps);
}

export async function createCoupon(input: CreateCouponInput) {
  const existing = await Coupon.findOne({ code: input.code.toUpperCase() });
  if (existing) {
    throw new ConflictError("Un coupon avec ce code existe déjà", "COUPON_CODE_TAKEN");
  }
  const coupon = await Coupon.create({
    ...input,
    code: input.code.toUpperCase(),
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
  });
  return toCouponDTO(coupon);
}

export async function updateCoupon(id: string, changes: UpdateCouponInput) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new NotFoundError("Coupon introuvable", "COUPON_NOT_FOUND");

  if (changes.code && changes.code.toUpperCase() !== coupon.code) {
    const existing = await Coupon.findOne({ code: changes.code.toUpperCase() });
    if (existing) {
      throw new ConflictError("Un coupon avec ce code existe déjà", "COUPON_CODE_TAKEN");
    }
    coupon.code = changes.code.toUpperCase();
  }
  if (changes.type !== undefined) coupon.type = changes.type;
  if (changes.value !== undefined) coupon.value = changes.value;
  if (changes.minSubtotal !== undefined) coupon.minSubtotal = changes.minSubtotal;
  if (changes.maxUses !== undefined) coupon.maxUses = changes.maxUses;
  if (changes.isActive !== undefined) coupon.isActive = changes.isActive;
  if (changes.expiresAt !== undefined) {
    coupon.expiresAt = changes.expiresAt ? new Date(changes.expiresAt) : undefined;
  }

  await coupon.save();
  return toCouponDTO(coupon);
}

export async function deleteCoupon(id: string): Promise<void> {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new NotFoundError("Coupon introuvable", "COUPON_NOT_FOUND");
}
