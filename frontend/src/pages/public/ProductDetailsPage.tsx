import { HeartIcon, MinusIcon, PackageXIcon, PlusIcon, ShoppingBagIcon } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { Seo } from "@/components/common/Seo";
import { StarRating } from "@/components/common/StarRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants/routes.constants";
import { useProductQuery } from "@/features/products/api/useProductQuery";
import { useRelatedProductsQuery } from "@/features/products/api/useRelatedProductsQuery";
import { ProductGallery } from "@/features/products/components/ProductGallery";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { ProductReviews } from "@/features/products/components/ProductReviews";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProductQuery(slug);
  const { data: relatedProducts, isLoading: relatedLoading } = useRelatedProductsQuery(product);

  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) => state.has(product?.id ?? ""));

  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return <LoadingState className="min-h-[60vh]" label="Chargement du produit…" />;
  }

  if (!product) {
    return (
      <div className="container-page py-16">
        <Seo title="Produit introuvable" noIndex />
        <EmptyState
          icon={PackageXIcon}
          title="Ce produit n'existe plus"
          description="Il a peut-être été retiré du catalogue ou l'adresse est incorrecte."
          action={
            <Button asChild>
              <Link to={ROUTES.shop}>Retour à la boutique</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const maxQuantity = Math.max(1, Math.min(product.stock, 10));

  function handleAddToCart() {
    if (!product || isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity,
      stock: product.stock,
    });
    toast.success(`${product.name} ajouté au panier.`);
  }

  function handleToggleWishlist() {
    if (!product) return;
    toggleWishlist(product);
    toast.success(isWishlisted ? "Retiré des favoris." : "Ajouté aux favoris.");
  }

  return (
    <div className="container-page py-10">
      <Seo
        title={product.name}
        description={product.shortDescription}
        image={product.images[0]}
        canonicalPath={ROUTES.product(product.slug)}
      />

      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to={ROUTES.shop} className="hover:text-foreground">Boutique</Link>
        <span className="mx-2">/</span>
        <Link to={`${ROUTES.shop}?category=${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="space-y-6">
          <div className="space-y-2">
            {product.brand && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>
            )}
            <h1 className="font-heading text-3xl font-semibold text-foreground">{product.name}</h1>
            <div className="flex items-center gap-2">
              <StarRating rating={product.rating} />
              <a href="#avis" className="text-sm text-muted-foreground hover:text-foreground">
                {product.reviewCount} avis
              </a>
            </div>
          </div>

          <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} currency={product.currency} size="lg" />

          <p className="text-sm text-muted-foreground">{product.shortDescription}</p>

          <div>
            {isOutOfStock ? (
              <Badge variant="outline">Rupture de stock</Badge>
            ) : product.stock < 10 ? (
              <Badge variant="warning">Plus que {product.stock} en stock</Badge>
            ) : (
              <Badge variant="success">En stock</Badge>
            )}
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-md border border-input">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuer la quantité"
              >
                <MinusIcon className="size-4" />
              </Button>
              <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={quantity >= maxQuantity}
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                aria-label="Augmenter la quantité"
              >
                <PlusIcon className="size-4" />
              </Button>
            </div>

            <Button size="lg" onClick={handleAddToCart} disabled={isOutOfStock} className="flex-1 sm:flex-none">
              <ShoppingBagIcon /> Ajouter au panier
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleToggleWishlist}
              aria-pressed={isWishlisted}
              aria-label="Ajouter aux favoris"
            >
              <HeartIcon className={isWishlisted ? "fill-destructive text-destructive" : ""} />
            </Button>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-foreground">Référence :</span> <span className="text-muted-foreground">{product.sku}</span></p>
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mx-auto mt-16 max-w-3xl space-y-4">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
      </section>

      <section id="avis" className="mx-auto mt-16 max-w-3xl scroll-mt-20">
        <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">Avis clients</h2>
        <ProductReviews product={product} />
      </section>

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">Vous aimerez aussi</h2>
          <ProductGrid products={relatedProducts} isLoading={relatedLoading} skeletonCount={4} />
        </section>
      )}
    </div>
  );
}
