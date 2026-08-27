import { ArrowRightIcon, PackageCheckIcon, ShieldCheckIcon, TruckIcon } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero.png";
import { Seo } from "@/components/common/Seo";
import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME, FREE_SHIPPING_THRESHOLD } from "@/constants/app.constants";
import { ROUTES } from "@/constants/routes.constants";
import { useCategoriesQuery } from "@/features/categories/api/useCategoriesQuery";
import { useFeaturedProductsQuery, useNewArrivalsQuery } from "@/features/products/api/useFeaturedProductsQuery";
import { ProductGrid } from "@/features/products/components/ProductGrid";

const TRUST_POINTS = [
  {
    icon: TruckIcon,
    title: "Livraison rapide",
    description: `Offerte dès ${FREE_SHIPPING_THRESHOLD} € d'achat, partout en France.`,
  },
  {
    icon: ShieldCheckIcon,
    title: "Paiement sécurisé",
    description: "Vos données bancaires ne transitent jamais par nos serveurs.",
  },
  {
    icon: PackageCheckIcon,
    title: "Retours simplifiés",
    description: "30 jours pour changer d'avis, sans justification.",
  },
];

export default function HomePage() {
  const { data: categories, isLoading: categoriesLoading } = useCategoriesQuery();
  const { data: featured, isLoading: featuredLoading } = useFeaturedProductsQuery(8);
  const { data: newArrivals, isLoading: newArrivalsLoading } = useNewArrivalsQuery(4);

  return (
    <div>
      <Seo title={APP_NAME} description={APP_DESCRIPTION} canonicalPath={ROUTES.home} />

      <section className="container-page grid gap-10 py-12 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-wide text-accent">Nouvelle collection</p>
          <h1 className="font-heading text-4xl font-semibold text-foreground sm:text-5xl">
            Le raffinement, livré chez vous.
          </h1>
          <p className="max-w-md text-base text-muted-foreground">{APP_DESCRIPTION}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={ROUTES.shop}>
                Découvrir la boutique <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={`${ROUTES.shop}?sort=newest`}>Nouveautés</Link>
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl bg-muted">
          <img src={heroImage} alt="Sélection Luméra" className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="container-page grid gap-6 py-10 sm:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="size-6 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-semibold text-foreground">Catégories</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categoriesLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`${ROUTES.shop}?category=${category.slug}`}
              className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
            >
              <img
                src={category.imageUrl}
                alt={category.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
              <p className="absolute inset-x-0 bottom-3 text-center text-sm font-semibold text-white">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-semibold text-foreground">Sélection du moment</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to={ROUTES.shop}>
              Tout voir <ArrowRightIcon />
            </Link>
          </Button>
        </div>
        <ProductGrid products={featured ?? []} isLoading={featuredLoading} />
      </section>

      <section className="container-page py-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-semibold text-foreground">Nouveautés</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to={`${ROUTES.shop}?sort=newest`}>
              Tout voir <ArrowRightIcon />
            </Link>
          </Button>
        </div>
        <ProductGrid products={newArrivals ?? []} isLoading={newArrivalsLoading} skeletonCount={4} />
      </section>
    </div>
  );
}
