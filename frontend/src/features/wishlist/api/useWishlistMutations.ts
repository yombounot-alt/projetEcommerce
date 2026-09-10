import { useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "@/api/services/wishlist.service";
import { queryKeys } from "@/api/query-keys";

export function useAddWishlistItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => wishlistService.add(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}

export function useRemoveWishlistItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => wishlistService.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}
