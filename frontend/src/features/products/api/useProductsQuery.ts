import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { productService } from "@/api/services/product.service";
import { queryKeys } from "@/api/query-keys";
import type { ProductFilters } from "@/types/product.types";

export function useProductsQuery(filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => productService.list(filters),
    placeholderData: keepPreviousData,
  });
}
