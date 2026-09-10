import { useQuery } from "@tanstack/react-query";
import { productService } from "@/api/services/product.service";
import { queryKeys } from "@/api/query-keys";

export function useProductByIdQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.byId(id ?? ""),
    queryFn: () => productService.getById(id as string),
    enabled: Boolean(id),
  });
}
