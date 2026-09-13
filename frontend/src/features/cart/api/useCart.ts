import { useAuthStore } from "@/store/authStore";
import { selectCartCount, selectCartSubtotal, useCartStore } from "@/store/cartStore";
import type { CartItem } from "@/types/order.types";
import {
  useAddCartItemMutation,
  useClearCartMutation,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from "./useCartMutations";
import { useCartQuery } from "./useCartQuery";

export interface CartApi {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
  /** true si le panier est celui du serveur (client authentifié), false si panier invité local. */
  isSynced: boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clear: () => void;
}

/**
 * Point d'accès unique au panier pour l'UI.
 *
 * Le backend n'expose le panier (`/cart`) qu'aux clients authentifiés avec le rôle
 * "customer" (voir cart.routes.ts). Un visiteur non connecté (ou un admin/vendeur qui
 * navigue sur la boutique) continue donc d'utiliser le panier local persistant
 * (cartStore/localStorage) ; dès qu'un client est authentifié, ce hook bascule sur le
 * vrai panier serveur, qui est la source de vérité (prix/stock toujours recalculés).
 */
export function useCart(): CartApi {
  const role = useAuthStore((state) => state.user?.role);
  const isSynced = role === "customer";

  const localItems = useCartStore((state) => state.items);
  const localSubtotal = useCartStore(selectCartSubtotal);
  const localCount = useCartStore(selectCartCount);
  const localAddItem = useCartStore((state) => state.addItem);
  const localUpdateQuantity = useCartStore((state) => state.updateQuantity);
  const localRemoveItem = useCartStore((state) => state.removeItem);
  const localClear = useCartStore((state) => state.clear);

  const cartQuery = useCartQuery(isSynced);
  const addMutation = useAddCartItemMutation();
  const updateMutation = useUpdateCartItemMutation();
  const removeMutation = useRemoveCartItemMutation();
  const clearMutation = useClearCartMutation();

  if (isSynced) {
    return {
      items: cartQuery.data?.items ?? [],
      subtotal: cartQuery.data?.subtotal ?? 0,
      itemCount: cartQuery.data?.itemCount ?? 0,
      isLoading: cartQuery.isLoading,
      isSynced: true,
      addItem: (item) =>
        addMutation.mutate({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
        }),
      updateQuantity: (productId, quantity, variantId) =>
        quantity <= 0
          ? removeMutation.mutate({ productId, variantId })
          : updateMutation.mutate({ productId, quantity, variantId }),
      removeItem: (productId, variantId) => removeMutation.mutate({ productId, variantId }),
      clear: () => clearMutation.mutate(),
    };
  }

  return {
    items: localItems,
    subtotal: localSubtotal,
    itemCount: localCount,
    isLoading: false,
    isSynced: false,
    addItem: localAddItem,
    updateQuantity: localUpdateQuantity,
    removeItem: localRemoveItem,
    clear: localClear,
  };
}
