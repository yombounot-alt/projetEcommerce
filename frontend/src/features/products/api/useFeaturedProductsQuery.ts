import { useQuery } from "@tanstack/react-query";
import { productService } from "@/api/services/product.service";
import { queryKeys } from "@/api/query-keys";

export function useFeaturedProductsQuery(limit = 8) {
  return useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: () => productService.getFeatured(limit),
  });
}

export function useNewArrivalsQuery(limit = 8) {
  return useQuery({
    queryKey: queryKeys.products.newArrivals(),
    queryFn: () => productService.getNewArrivals(limit),
  });
}
