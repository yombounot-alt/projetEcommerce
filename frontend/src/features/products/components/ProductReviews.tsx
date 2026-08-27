import { StarRating } from "@/components/common/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { MessageSquareIcon } from "lucide-react";
import { useProductReviewsQuery } from "@/features/products/api/useProductReviewsQuery";
import { formatDate } from "@/utils/format";
import type { Product } from "@/types/product.types";

export function ProductReviews({ product }: { product: Product }) {
  const { data: reviews, isLoading } = useProductReviewsQuery(product.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareIcon}
        title="Aucun avis pour ce produit"
        description="Soyez le premier à partager votre expérience avec ce produit."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <p className="font-heading text-3xl font-semibold text-foreground">{product.rating.toFixed(1)}</p>
        <div>
          <StarRating rating={product.rating} />
          <p className="text-sm text-muted-foreground">{product.reviewCount} avis</p>
        </div>
      </div>

      <div className="space-y-5">
        {reviews.map((review) => (
          <div key={review.id} className="space-y-2 border-b border-border pb-5 last:border-0">
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={review.authorAvatarUrl} alt={review.authorName} />
                <AvatarFallback>{review.authorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{review.authorName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
              </div>
              {review.verifiedPurchase && (
                <Badge variant="secondary" className="ml-auto">Achat vérifié</Badge>
              )}
            </div>
            <StarRating rating={review.rating} size={14} />
            <p className="text-sm font-medium text-foreground">{review.title}</p>
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
