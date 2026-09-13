import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { mockDelay } from "@/lib/mock-delay";
import { mockProducts } from "@/mocks/products";
import type { CartItem } from "@/types/order.types";

export interface CartDTO {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

/**
 * État du panier serveur simulé en mode mock. Reconstruit toujours les items à partir de
 * mockProducts (prix/stock/nom à jour), comme le fait le vrai backend à partir de MongoDB,
 * pour que le comportement reste fidèle une fois VITE_USE_MOCKS désactivé.
 */
let mockCartLines: { productId: string; quantity: number }[] = [];

function buildMockCartDTO(): CartDTO {
  const items: CartItem[] = [];
  for (const line of mockCartLines) {
    const product = mockProducts.find((p) => p.id === line.productId);
    if (!product || product.status !== "published") continue;
    const quantity = Math.min(line.quantity, product.stock || line.quantity);
    items.push({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? "",
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity,
      stock: product.stock,
    });
  }
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2),
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, subtotal, itemCount };
}

export const cartService = {
  async getCart(): Promise<CartDTO> {
    if (env.useMocks) {
      return mockDelay(buildMockCartDTO(), 200);
    }
    const { data } = await httpClient.get<CartDTO>("/cart");
    return data;
  },

  async addItem(productId: string, quantity = 1, variantId?: string): Promise<CartDTO> {
    if (env.useMocks) {
      const product = mockProducts.find((p) => p.id === productId);
      const maxStock = product?.stock ?? 999;
      const existing = mockCartLines.find((l) => l.productId === productId);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, maxStock, 999);
      } else {
        mockCartLines.push({ productId, quantity: Math.min(quantity, maxStock, 999) });
      }
      return mockDelay(buildMockCartDTO(), 250);
    }
    const { data } = await httpClient.post<CartDTO>("/cart/items", {
      productId,
      variantId,
      quantity,
    });
    return data;
  },

  async updateItem(productId: string, quantity: number, variantId?: string): Promise<CartDTO> {
    if (env.useMocks) {
      const line = mockCartLines.find((l) => l.productId === productId);
      if (line) {
        const product = mockProducts.find((p) => p.id === productId);
        line.quantity = Math.min(quantity, product?.stock ?? 999, 999);
      }
      return mockDelay(buildMockCartDTO(), 200);
    }
    const { data } = await httpClient.patch<CartDTO>(`/cart/items/${productId}`, {
      quantity,
      variantId,
    });
    return data;
  },

  async removeItem(productId: string, variantId?: string): Promise<CartDTO> {
    if (env.useMocks) {
      mockCartLines = mockCartLines.filter((l) => l.productId !== productId);
      return mockDelay(buildMockCartDTO(), 200);
    }
    const { data } = await httpClient.delete<CartDTO>(`/cart/items/${productId}`, {
      params: variantId ? { variantId } : undefined,
    });
    return data;
  },

  async clear(): Promise<void> {
    if (env.useMocks) {
      mockCartLines = [];
      await mockDelay(undefined, 150);
      return;
    }
    await httpClient.delete("/cart");
  },
};
