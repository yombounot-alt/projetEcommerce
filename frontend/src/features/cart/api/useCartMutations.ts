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
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.addItem(productId, quantity),
    onSuccess,
  });
}

export function useUpdateCartItemMutation() {
  const { onSuccess } = useCartMutation();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.updateItem(productId, quantity),
    onSuccess,
  });
}

export function useRemoveCartItemMutation() {
  const { onSuccess } = useCartMutation();
  return useMutation({
    mutationFn: (productId: string) => cartService.removeItem(productId),
    onSuccess,
  });
}

export function useClearCartMutation() {
  const { queryClient } = useCartMutation();
  return useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.cart.all, { items: [], subtotal: 0, itemCount: 0 } satisfies CartDTO);
    },
  });
}
