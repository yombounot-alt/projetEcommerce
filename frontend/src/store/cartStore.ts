import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CART_STORAGE_KEY } from "@/constants/app.constants";
import type { CartItem } from "@/types/order.types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

/** Two lines are the same only if both productId AND variantId match — two different
 *  variants of the same product are always separate cart lines (mirrors the backend's
 *  cart.service.ts#matchesLine). */
function isSameLine(item: CartItem, productId: string, variantId?: string): boolean {
  return item.productId === productId && (item.variantId ?? undefined) === (variantId ?? undefined);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const existing = get().items.find((i) => isSameLine(i, item.productId, item.variantId));
        if (existing) {
          const nextQuantity = Math.min(existing.quantity + item.quantity, existing.stock);
          set({
            items: get().items.map((i) =>
              isSameLine(i, item.productId, item.variantId) ? { ...i, quantity: nextQuantity } : i,
            ),
          });
          return;
        }
        set({ items: [...get().items, item] });
      },

      removeItem: (productId, variantId) => {
        set({ items: get().items.filter((i) => !isSameLine(i, productId, variantId)) });
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            isSameLine(i, productId, variantId)
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i,
          ),
        });
      },

      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const selectCartSubtotal = (state: CartState): number =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartCount = (state: CartState): number =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);
