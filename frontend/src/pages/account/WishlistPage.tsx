import { HeartIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes.constants";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { useWishlistStore } from "@/store/wishlistStore";

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);

  return (
    <div className="container-page py-10">
      <Seo title="Mes favoris" canonicalPath={ROUTES.wishlist} noIndex />
      <PageHeader title="Mes favoris" description="Retrouvez les produits que vous avez ajoutés à vos favoris." />

      {items.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="Aucun favori pour le moment"
          description="Ajoutez des produits à vos favoris pour les retrouver facilement."
          action={<Button asChild><Link to={ROUTES.shop}>Découvrir la boutique</Link></Button>}
        />
      ) : (
        <ProductGrid products={items} />
      )}
    </div>
  );
}
