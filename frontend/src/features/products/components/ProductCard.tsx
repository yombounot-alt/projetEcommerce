import { HeartIcon, ShoppingBagIcon } from "lucide-react";
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes.constants";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { ProductListItem } from "@/types/product.types";

export function ProductCard({ product }: { product: ProductListItem }) {
  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) => state.has(product.id));
  const isOutOfStock = product.stock <= 0;

  function handleAddToCart(event: MouseEvent) {
    event.preventDefault();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity: 1,
      stock: product.stock,
    });
    toast.success(`${product.name} ajouté au panier.`);
  }

  function handleToggleWishlist(event: MouseEvent) {
    event.preventDefault();
    toggleWishlist(product);
    toast.success(isWishlisted ? "Retiré des favoris." : "Ajouté aux favoris.");
  }

  return (
    <Link
      to={ROUTES.product(product.slug)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && <Badge variant="accent">Nouveau</Badge>}
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <Badge variant="destructive">Promo</Badge>
          )}
          {isOutOfStock && <Badge variant="outline">Rupture de stock</Badge>}
        </div>

        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label="Ajouter aux favoris"
          className={cn(
            "absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors",
            isWishlisted ? "text-destructive" : "text-foreground hover:text-destructive",
          )}
        >
          <HeartIcon className={cn("size-4", isWishlisted && "fill-current")} />
        </button>

        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="absolute inset-x-3 bottom-3 translate-y-12 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingBagIcon /> Ajouter au panier
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.category.name}
        </p>
        <p className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</p>
        <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} size="sm" className="mt-auto pt-1" />
      </div>
    </Link>
  );
}
