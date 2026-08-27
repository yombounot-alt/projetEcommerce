import { useQuery } from "@tanstack/react-query";
import { productService } from "@/api/services/product.service";
import { queryKeys } from "@/api/query-keys";

export function useProductReviewsQuery(productId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.reviews(productId ?? ""),
    queryFn: () => productService.getReviews(productId as string),
    enabled: Boolean(productId),
  });
}
