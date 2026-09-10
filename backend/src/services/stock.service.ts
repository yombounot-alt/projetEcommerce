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
) {
  await StockMovement.create(
    [
      {
        product: productId,
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
 */
export async function reserveStock(
  productId: string,
  quantity: number,
  meta: MovementMeta,
): Promise<void> {
  const updated = await Product.findOneAndUpdate(
    { _id: productId, availableStock: { $gte: quantity } },
    { $inc: { availableStock: -quantity, reservedStock: quantity } },
    { new: true, session: meta.session },
  );

  if (!updated) {
    throw new ConflictError("Stock insuffisant", "INSUFFICIENT_STOCK");
  }

  await recordMovement(productId, "RESERVED", quantity, meta);
}

/** Releases previously reserved stock back to available (order cancelled before payment confirmation). */
export async function releaseStock(
  productId: string,
  quantity: number,
  meta: MovementMeta,
): Promise<void> {
  await Product.updateOne(
    { _id: productId },
    { $inc: { reservedStock: -quantity, availableStock: quantity } },
    { session: meta.session },
  );
  await recordMovement(productId, "RELEASED", quantity, meta);
}

/** Confirms reserved stock as sold (payment captured) — moves reservedStock -> soldStock. */
export async function confirmStockSale(
  productId: string,
  quantity: number,
  meta: MovementMeta,
): Promise<void> {
  await Product.updateOne(
    { _id: productId },
    { $inc: { reservedStock: -quantity, soldStock: quantity } },
    { session: meta.session },
  );
  await recordMovement(productId, "OUT", quantity, meta);
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
