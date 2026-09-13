import mongoose from "mongoose";
import { Cart, type ICart } from "../models/Cart";
import { Product, type IProduct, type IProductVariant } from "../models/Product";
import { BadRequestError, NotFoundError } from "../utils/AppError";

const MAX_SAVE_RETRIES = 5;

/**
 * Retries `mutate` + `save()` on Mongoose's VersionError (optimistic concurrency conflict —
 * the cart's `__v` changed between load and save, i.e. two requests raced on the same
 * cart). Each retry re-reads the latest cart state before re-applying `mutate`, so a lost
 * update (double-click "add to cart", two tabs) can never silently drop one of the writes.
 */
async function saveWithRetry(userId: string, mutate: (cart: ICart) => void): Promise<ICart> {
  for (let attempt = 0; attempt < MAX_SAVE_RETRIES; attempt++) {
    const cart = await getOrCreateCart(userId);
    mutate(cart);
    try {
      await cart.save();
      return cart;
    } catch (error) {
      const isLastAttempt = attempt === MAX_SAVE_RETRIES - 1;
      if (error instanceof mongoose.Error.VersionError && !isLastAttempt) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("unreachable"); // loop always returns or throws
}

export interface CartItemDTO {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  stock: number;
}

export interface CartDTO {
  items: CartItemDTO[];
  subtotal: number;
  itemCount: number;
}

function formatVariantLabel(attributes: Record<string, string>): string {
  return Object.values(attributes).join(" / ");
}

/**
 * Resolves the effective price/stock/image for a cart line: the variant's own values when
 * a variant product, falling back to the parent product's for a simple product. Throws if
 * `variantId` doesn't exist on this product, or is required (product has variants) but
 * missing — a customer must always pick one of the actual purchasable combinations.
 */
function resolveVariant(
  product: IProduct,
  variantId: string | undefined,
): IProductVariant | undefined {
  if (product.variants.length === 0) {
    return undefined; // simple product — nothing to resolve
  }
  if (!variantId) {
    throw new BadRequestError(
      "Veuillez sélectionner une variante (taille, couleur…)",
      "VARIANT_REQUIRED",
    );
  }
  const variant = product.variants.find((v) => String(v._id) === variantId);
  if (!variant) {
    throw new NotFoundError("Variante introuvable pour ce produit", "VARIANT_NOT_FOUND");
  }
  return variant;
}

/**
 * Rebuilds the cart response from live Product data every time — price, availability and
 * name are never trusted from what was stored when the item was added (rule 15). Items
 * whose product (or selected variant) has since been deleted are dropped.
 */
async function toCartDTO(
  items: { product: unknown; variant?: unknown; quantity: number }[],
): Promise<CartDTO> {
  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const resolved: CartItemDTO[] = [];
  for (const item of items) {
    const product = productMap.get(String(item.product));
    if (!product || product.status !== "published") continue;

    const variantId = item.variant ? String(item.variant) : undefined;
    const variant = variantId
      ? product.variants.find((v) => String(v._id) === variantId)
      : undefined;
    if (variantId && !variant) continue; // variant was deleted since — drop the line

    const stock = variant ? variant.availableStock : product.availableStock;
    const price = variant?.price ?? product.price;
    const quantity = Math.min(item.quantity, stock || item.quantity);

    resolved.push({
      productId: String(product._id),
      variantId,
      variantLabel: variant ? formatVariantLabel(variant.attributes) : undefined,
      name: product.name,
      slug: product.slug,
      image: variant?.image ?? product.images[0] ?? "",
      price,
      compareAtPrice: variant?.compareAtPrice ?? product.compareAtPrice,
      quantity,
      stock,
    });
  }

  const subtotal = resolved.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = resolved.reduce((sum, item) => sum + item.quantity, 0);
  return { items: resolved, subtotal: Number(subtotal.toFixed(2)), itemCount };
}

/**
 * Atomic find-or-create: a plain findOne-then-create would race when a user's very first
 * cart operation ever is fired twice concurrently (e.g. two tabs), hitting the `user`
 * unique index on the second create. A single upsert avoids that window entirely.
 */
async function getOrCreateCart(userId: string): Promise<ICart> {
  return Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, new: true },
  );
}

export async function getCart(userId: string): Promise<CartDTO> {
  const cart = await getOrCreateCart(userId);
  return toCartDTO(cart.items);
}

function matchesLine(
  item: { product: unknown; variant?: unknown },
  productId: string,
  variantId?: string,
): boolean {
  return String(item.product) === productId && String(item.variant ?? "") === (variantId ?? "");
}

export async function addCartItem(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string,
): Promise<CartDTO> {
  const product = await Product.findById(productId);
  if (!product || product.status !== "published") {
    throw new NotFoundError("Produit introuvable ou indisponible", "PRODUCT_NOT_FOUND");
  }
  const variant = resolveVariant(product, variantId);
  const stock = variant ? variant.availableStock : product.availableStock;
  if (stock < 1) {
    throw new BadRequestError("Ce produit est en rupture de stock", "OUT_OF_STOCK");
  }

  const cart = await saveWithRetry(userId, (cart) => {
    const existing = cart.items.find((item) => matchesLine(item, productId, variantId));
    const requestedTotal = (existing?.quantity ?? 0) + quantity;
    // Reject rather than silently clamp: the customer must know they asked for more than
    // is available, instead of getting a smaller quantity than requested with no signal
    // (mirrors reserveStock's INSUFFICIENT_STOCK behavior at checkout — same rule, same UX).
    if (requestedTotal > stock) {
      throw new BadRequestError(
        `Quantité demandée indisponible (${stock} en stock)`,
        "INSUFFICIENT_STOCK",
      );
    }
    if (existing) {
      existing.quantity = Math.min(requestedTotal, 999);
    } else {
      cart.items.push({
        product: product._id,
        variant: variant?._id,
        quantity: Math.min(quantity, 999),
      });
    }
  });
  return toCartDTO(cart.items);
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string,
): Promise<CartDTO> {
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError("Produit introuvable", "PRODUCT_NOT_FOUND");
  }
  const variant = resolveVariant(product, variantId);
  const stock = variant ? variant.availableStock : product.availableStock;
  if (quantity > stock) {
    throw new BadRequestError(
      `Quantité demandée indisponible (${stock} en stock)`,
      "INSUFFICIENT_STOCK",
    );
  }

  const cart = await saveWithRetry(userId, (cart) => {
    const item = cart.items.find((i) => matchesLine(i, productId, variantId));
    if (!item) {
      throw new NotFoundError("Article introuvable dans le panier", "CART_ITEM_NOT_FOUND");
    }
    item.quantity = Math.min(quantity, 999);
  });
  return toCartDTO(cart.items);
}

export async function removeCartItem(
  userId: string,
  productId: string,
  variantId?: string,
): Promise<CartDTO> {
  const cart = await saveWithRetry(userId, (cart) => {
    cart.items = cart.items.filter(
      (item) => !matchesLine(item, productId, variantId),
    ) as unknown as typeof cart.items;
  });
  return toCartDTO(cart.items);
}

export async function clearCart(userId: string): Promise<void> {
  await Cart.updateOne({ user: userId }, { items: [] }, { upsert: true });
}
