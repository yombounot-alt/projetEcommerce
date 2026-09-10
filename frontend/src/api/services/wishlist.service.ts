import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { mockDelay } from "@/lib/mock-delay";
import { mockProducts } from "@/mocks/products";
import type { ProductListItem } from "@/types/product.types";
import { toListItem } from "./product.service";

/** Favoris côté serveur simulés en mode mock — mêmes règles que le vrai backend : seuls les
 * identifiants produit sont stockés, la fiche (prix/stock/nom) est toujours relue en direct. */
let mockWishlistProductIds: string[] = [];

export const wishlistService = {
  async list(): Promise<ProductListItem[]> {
    if (env.useMocks) {
      const items = mockWishlistProductIds
        .map((id) => mockProducts.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => !!p && p.status === "published")
        .map(toListItem);
      return mockDelay(items, 200);
    }
    const { data } = await httpClient.get<ProductListItem[]>("/wishlist");
    return data;
  },

  async add(productId: string): Promise<void> {
    if (env.useMocks) {
      if (!mockWishlistProductIds.includes(productId)) {
        mockWishlistProductIds.push(productId);
      }
      await mockDelay(undefined, 150);
      return;
    }
    await httpClient.post(`/wishlist/${productId}`);
  },

  async remove(productId: string): Promise<void> {
    if (env.useMocks) {
      mockWishlistProductIds = mockWishlistProductIds.filter((id) => id !== productId);
      await mockDelay(undefined, 150);
      return;
    }
    await httpClient.delete(`/wishlist/${productId}`);
  },
};
