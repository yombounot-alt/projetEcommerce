import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import { BadRequestError, NotFoundError } from "../utils/AppError";

export interface CartItemDTO {
  productId: string;
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

/**
 * Rebuilds the cart response from live Product data every time — price, availability and
 * name are never trusted from what was stored when the item was added (rule 15). Items
 * whose product has since been deleted are dropped and reported via a clamped quantity of 0.
 */
async function toCartDTO(items: { product: unknown; quantity: number }[]): Promise<CartDTO> {
  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const resolved: CartItemDTO[] = [];
  for (const item of items) {
    const product = productMap.get(String(item.product));
    if (!product || product.status !== "published") continue;
    const quantity = Math.min(item.quantity, product.availableStock || item.quantity);
    resolved.push({
      productId: String(product._id),
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? "",
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity,
      stock: product.availableStock,
    });
  }

  const subtotal = resolved.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = resolved.reduce((sum, item) => sum + item.quantity, 0);
  return { items: resolved, subtotal: Number(subtotal.toFixed(2)), itemCount };
}

async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

export async function getCart(userId: string): Promise<CartDTO> {
  const cart = await getOrCreateCart(userId);
  return toCartDTO(cart.items);
}

export async function addCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartDTO> {
  const product = await Product.findById(productId);
  if (!product || product.status !== "published") {
    throw new NotFoundError("Produit introuvable ou indisponible", "PRODUCT_NOT_FOUND");
  }
  if (product.availableStock < 1) {
    throw new BadRequestError("Ce produit est en rupture de stock", "OUT_OF_STOCK");
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => String(item.product) === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, product.availableStock, 999);
  } else {
    cart.items.push({
      product: product._id,
      quantity: Math.min(quantity, product.availableStock, 999),
    });
  }
  await cart.save();
  return toCartDTO(cart.items);
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartDTO> {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => String(i.product) === productId);
  if (!item) {
    throw new NotFoundError("Article introuvable dans le panier", "CART_ITEM_NOT_FOUND");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError("Produit introuvable", "PRODUCT_NOT_FOUND");
  }

  item.quantity = Math.min(quantity, product.availableStock, 999);
  await cart.save();
  return toCartDTO(cart.items);
}

export async function removeCartItem(userId: string, productId: string): Promise<CartDTO> {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter(
    (item) => String(item.product) !== productId,
  ) as unknown as typeof cart.items;
  await cart.save();
  return toCartDTO(cart.items);
}

export async function clearCart(userId: string): Promise<void> {
  await Cart.updateOne({ user: userId }, { items: [] }, { upsert: true });
}
