import { PackageSearchIcon } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types/product.types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: ProductListItem[];
  isLoading?: boolean;
  view?: "grid" | "list";
  skeletonCount?: number;
}

export function ProductGrid({ products, isLoading, view = "grid", skeletonCount = 8 }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-4", view === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1")}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearchIcon}
        title="Aucun produit trouvé"
        description="Essayez d'ajuster vos filtres ou votre recherche pour découvrir d'autres produits."
      />
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-6",
        view === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1",
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
