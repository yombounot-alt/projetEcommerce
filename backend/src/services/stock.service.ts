import type { ClientSession } from "mongoose";
import { Product } from "../models/Product";
import { StockMovement, type StockMovementType } from "../models/StockMovement";
import { ConflictError } from "../utils/AppError";

interface MovementMeta {
  orderId?: string;
  actorId?: string;
  reason: string;
  session?: ClientSession;
}

async function recordMovement(
  productId: string,
  type: StockMovementType,
  quantity: number,
  meta: MovementMeta,
  variantId?: string,
) {
  await StockMovement.create(
    [
      {
        product: productId,
        variant: variantId,
        type,
        quantity,
        reason: meta.reason,
        order: meta.orderId,
        actor: meta.actorId,
      },
    ],
    { session: meta.session },
  );
}

/**
 * Atomically moves `quantity` units from availableStock to reservedStock, only if enough
 * stock is available. The condition (`availableStock: { $gte: quantity }`) is evaluated
 * server-side by MongoDB as part of the single update operation, so two concurrent
 * checkouts racing for the last unit cannot both succeed (rule: avoid oversell).
 *
 * When `variantId` is given, the same guarantee applies at the variant level (via
 * `$elemMatch` so the stock check and the positional update both target the SAME array
 * element — two separate top-level conditions on `variants.*` would NOT guarantee that).
 * The product's top-level availableStock/reservedStock are simultaneously kept as an
 * accurate sum-of-variants aggregate, in the same atomic operation, since search/filter/
 * list code reads those top-level fields regardless of whether the product has variants.
 */
export async function reserveStock(
  productId: string,
  quantity: number,
  meta: MovementMeta,
  variantId?: string,
): Promise<void> {
  const updated = variantId
    ? await Product.findOneAndUpdate(
        {
          _id: productId,
          variants: { $elemMatch: { _id: variantId, availableStock: { $gte: quantity } } },
        },
        {
          $inc: {
            "variants.$.availableStock": -quantity,
            "variants.$.reservedStock": quantity,
            availableStock: -quantity,
            reservedStock: quantity,
          },
        },
        { new: true, session: meta.session },
      )
    : await Product.findOneAndUpdate(
        { _id: productId, availableStock: { $gte: quantity } },
        { $inc: { availableStock: -quantity, reservedStock: quantity } },
        { new: true, session: meta.session },
      );

  if (!updated) {
    throw new ConflictError("Stock insuffisant", "INSUFFICIENT_STOCK");
  }

  await recordMovement(productId, "RESERVED", quantity, meta, variantId);
}

/** Releases previously reserved stock back to available (order cancelled before payment confirmation). */
export async function releaseStock(
  productId: string,
  quantity: number,
  meta: MovementMeta,
  variantId?: string,
): Promise<void> {
  if (variantId) {
    await Product.updateOne(
      { _id: productId, "variants._id": variantId },
      {
        $inc: {
          "variants.$.reservedStock": -quantity,
          "variants.$.availableStock": quantity,
          reservedStock: -quantity,
          availableStock: quantity,
        },
      },
      { session: meta.session },
    );
  } else {
    await Product.updateOne(
      { _id: productId },
      { $inc: { reservedStock: -quantity, availableStock: quantity } },
      { session: meta.session },
    );
  }
  await recordMovement(productId, "RELEASED", quantity, meta, variantId);
}

/** Confirms reserved stock as sold (payment captured) — moves reservedStock -> soldStock. */
export async function confirmStockSale(
  productId: string,
  quantity: number,
  meta: MovementMeta,
  variantId?: string,
): Promise<void> {
  if (variantId) {
    await Product.updateOne(
      { _id: productId, "variants._id": variantId },
      {
        $inc: {
          "variants.$.reservedStock": -quantity,
          "variants.$.soldStock": quantity,
          reservedStock: -quantity,
          soldStock: quantity,
        },
      },
      { session: meta.session },
    );
  } else {
    await Product.updateOne(
      { _id: productId },
      { $inc: { reservedStock: -quantity, soldStock: quantity } },
      { session: meta.session },
    );
  }
  await recordMovement(productId, "OUT", quantity, meta, variantId);
}

/** Manual stock intake (restock) — increments availableStock directly. */
export async function addStock(
  productId: string,
  quantity: number,
  meta: MovementMeta,
): Promise<void> {
  await Product.updateOne(
    { _id: productId },
    { $inc: { availableStock: quantity } },
    { session: meta.session },
  );
  await recordMovement(productId, "IN", quantity, meta);
}

/** Manual correction (inventory audit) — sets availableStock to an explicit value. */
export async function adjustStock(
  productId: string,
  newAvailableStock: number,
  meta: MovementMeta,
): Promise<void> {
  const product = await Product.findById(productId).session(meta.session ?? null);
  if (!product) return;
  const delta = newAvailableStock - product.availableStock;
  product.availableStock = newAvailableStock;
  await product.save({ session: meta.session });
  await recordMovement(productId, "ADJUSTMENT", delta, meta);
}
