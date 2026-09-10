import { Wishlist } from "../models/Wishlist";
import { Product } from "../models/Product";
import { NotFoundError } from "../utils/AppError";
import { toProductListItemDTO } from "./product.service";
import type { IProduct } from "../models/Product";

type PopulatedProduct = IProduct & {
  category: { _id: unknown; name: string; slug: string } | null;
  brand?: { _id: unknown; name: string; slug: string } | null;
};

async function getOrCreateWishlist(userId: string) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
}

export async function getWishlist(userId: string) {
  const wishlist = await getOrCreateWishlist(userId);
  const products = await Product.find({ _id: { $in: wishlist.products }, status: "published" })
    .populate("category", "name slug")
    .populate("brand", "name slug");
  return products.map((p) => toProductListItemDTO(p as unknown as PopulatedProduct));
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError("Produit introuvable", "PRODUCT_NOT_FOUND");
  }
  await Wishlist.updateOne(
    { user: userId },
    { $addToSet: { products: productId } },
    { upsert: true },
  );
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  await Wishlist.updateOne({ user: userId }, { $pull: { products: productId } });
}
