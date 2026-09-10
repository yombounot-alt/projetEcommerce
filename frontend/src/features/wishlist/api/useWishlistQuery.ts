import { useQuery } from "@tanstack/react-query";
import { wishlistService } from "@/api/services/wishlist.service";
import { queryKeys } from "@/api/query-keys";

export function useWishlistQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.wishlist.all,
    queryFn: () => wishlistService.list(),
    enabled,
  });
}
