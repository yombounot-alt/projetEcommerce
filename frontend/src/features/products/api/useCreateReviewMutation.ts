import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productService, type ReviewInput } from "@/api/services/product.service";
import { queryKeys } from "@/api/query-keys";

export function useCreateReviewMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) => productService.createReview(productId, input),
    onSuccess: () => {
      // Invalider tout le préfixe "products" couvre à la fois la liste des avis et la fiche
      // produit (dont le rating/reviewCount changent après un nouvel avis).
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
