import { useQuery } from "@tanstack/react-query";
import { cartService } from "@/api/services/cart.service";
import { queryKeys } from "@/api/query-keys";

export function useCartQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: () => cartService.getCart(),
    enabled,
  });
}
