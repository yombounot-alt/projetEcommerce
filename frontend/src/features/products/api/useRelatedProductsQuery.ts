import { useQuery } from "@tanstack/react-query";
import { productService } from "@/api/services/product.service";
import { queryKeys } from "@/api/query-keys";
import type { Product } from "@/types/product.types";

export function useRelatedProductsQuery(product: Product | null | undefined) {
  return useQuery({
    queryKey: queryKeys.products.related(product?.id ?? ""),
    queryFn: () => productService.getRelated(product as Product),
    enabled: Boolean(product),
  });
}
