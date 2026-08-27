import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/api/services/product.service";
import { queryKeys } from "@/api/query-keys";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryService.list(),
    staleTime: 5 * 60_000,
  });
}
