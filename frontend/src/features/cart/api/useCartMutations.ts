import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService, type CartDTO } from "@/api/services/cart.service";
import { queryKeys } from "@/api/query-keys";

function useCartMutation() {
  const queryClient = useQueryClient();
  return {
    queryClient,
    onSuccess: (cart: CartDTO) => {
      queryClient.setQueryData(queryKeys.cart.all, cart);
    },
  };
}

export function useAddCartItemMutation() {
  const { onSuccess } = useCartMutation();
  return useMutation({
    mutationFn: ({
      productId,
      quantity,
      variantId,
    }: {
      productId: string;
      quantity: number;
      variantId?: string;
    }) => cartService.addItem(productId, quantity, variantId),
    onSuccess,
  });
}

export function useUpdateCartItemMutation() {
  const { onSuccess } = useCartMutation();
  return useMutation({
    mutationFn: ({
      productId,
      quantity,
      variantId,
    }: {
      productId: string;
      quantity: number;
      variantId?: string;
    }) => cartService.updateItem(productId, quantity, variantId),
    onSuccess,
  });
}

export function useRemoveCartItemMutation() {
  const { onSuccess } = useCartMutation();
  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId?: string }) =>
      cartService.removeItem(productId, variantId),
    onSuccess,
  });
}

export function useClearCartMutation() {
  const { queryClient } = useCartMutation();
  return useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.cart.all, {
        items: [],
        subtotal: 0,
        itemCount: 0,
      } satisfies CartDTO);
    },
  });
}
