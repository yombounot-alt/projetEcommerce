import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { ProductListItem } from "@/types/product.types";
import { useAddWishlistItemMutation, useRemoveWishlistItemMutation } from "./useWishlistMutations";
import { useWishlistQuery } from "./useWishlistQuery";

export interface WishlistApi {
  items: ProductListItem[];
  isLoading: boolean;
  /** true si les favoris sont ceux du serveur (client authentifié), false si liste locale invitée. */
  isSynced: boolean;
  toggle: (product: ProductListItem) => void;
  has: (productId: string) => boolean;
}

/**
 * Point d'accès unique aux favoris pour l'UI — même logique que useCart : le backend
 * n'expose `/wishlist` qu'aux clients authentifiés (voir wishlist.routes.ts), donc un
 * visiteur non connecté continue d'utiliser la liste locale persistante (wishlistStore).
 */
export function useWishlist(): WishlistApi {
  const role = useAuthStore((state) => state.user?.role);
  const isSynced = role === "customer";

  const localItems = useWishlistStore((state) => state.items);
  const localToggle = useWishlistStore((state) => state.toggle);
  const localHas = useWishlistStore((state) => state.has);

  const wishlistQuery = useWishlistQuery(isSynced);
  const addMutation = useAddWishlistItemMutation();
  const removeMutation = useRemoveWishlistItemMutation();

  if (isSynced) {
    const items = wishlistQuery.data ?? [];
    const has = (productId: string) => items.some((item) => item.id === productId);
    return {
      items,
      isLoading: wishlistQuery.isLoading,
      isSynced: true,
      has,
      toggle: (product) => {
        if (has(product.id)) {
          removeMutation.mutate(product.id);
        } else {
          addMutation.mutate(product.id);
        }
      },
    };
  }

  return {
    items: localItems,
    isLoading: false,
    isSynced: false,
    has: localHas,
    toggle: localToggle,
  };
}
