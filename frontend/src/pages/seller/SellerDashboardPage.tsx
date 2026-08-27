import { DollarSignIcon, PackageIcon, ShoppingCartIcon, StarIcon } from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { StatsCard } from "@/components/common/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardOverviewQuery } from "@/features/dashboard/api/useDashboardOverviewQuery";
import { formatPrice } from "@/utils/format";

const KPI_ICONS = [DollarSignIcon, ShoppingCartIcon, StarIcon, PackageIcon];

export default function SellerDashboardPage() {
  const { data, isLoading } = useDashboardOverviewQuery();

  if (isLoading || !data) return <LoadingState className="min-h-[50vh]" label="Chargement…" />;

  return (
    <div className="space-y-6">
      <Seo title="Tableau de bord vendeur" noIndex />
      <PageHeader title="Vue d'ensemble" description="Suivez la performance de votre boutique." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi, index) => (
          <StatsCard key={kpi.label} kpi={kpi} icon={KPI_ICONS[index]} />
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Produits les plus vendus</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.topProducts.map((product) => (
            <div key={product.productId} className="flex items-center gap-3">
              {product.image && <img src={product.image} alt={product.name} className="size-10 rounded-md object-cover" />}
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.unitsSold} vendus</p>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatPrice(product.revenue)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
