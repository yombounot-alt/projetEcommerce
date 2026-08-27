import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WISHLIST_STORAGE_KEY } from "@/constants/app.constants";
import type { ProductListItem } from "@/types/product.types";

interface WishlistState {
  items: ProductListItem[];
  toggle: (product: ProductListItem) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) => {
        const exists = get().items.some((i) => i.id === product.id);
        set({
          items: exists
            ? get().items.filter((i) => i.id !== product.id)
            : [...get().items, product],
        });
      },

      remove: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },

      has: (productId) => get().items.some((i) => i.id === productId),

      clear: () => set({ items: [] }),
    }),
    { name: WISHLIST_STORAGE_KEY },
  ),
);
