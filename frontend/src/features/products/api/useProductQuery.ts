import { useQuery } from "@tanstack/react-query";
import { productService } from "@/api/services/product.service";
import { queryKeys } from "@/api/query-keys";

export function useProductQuery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug ?? ""),
    queryFn: () => productService.getBySlug(slug as string),
    enabled: Boolean(slug),
  });
}
