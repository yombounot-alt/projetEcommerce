import { DollarSignIcon, PackageIcon, ShoppingCartIcon, UsersIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { StatsCard } from "@/components/common/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardOverviewQuery } from "@/features/dashboard/api/useDashboardOverviewQuery";
import { formatDate, formatPrice } from "@/utils/format";

const KPI_ICONS = [DollarSignIcon, ShoppingCartIcon, UsersIcon, PackageIcon];

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboardOverviewQuery();

  if (isLoading || !data) return <LoadingState className="min-h-[50vh]" label="Chargement du tableau de bord…" />;

  return (
    <div className="space-y-6">
      <Seo title="Tableau de bord administrateur" noIndex />
      <PageHeader title="Vue d'ensemble" description="Suivez les performances de la plateforme en temps réel." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi, index) => (
          <StatsCard key={kpi.label} kpi={kpi} icon={KPI_ICONS[index]} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Chiffre d'affaires (30 derniers jours)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueSeries}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => formatDate(value, { day: "2-digit", month: "2-digit", year: undefined })}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  formatter={(value) => formatPrice(Number(value ?? 0))}
                  labelFormatter={(label) => formatDate(String(label))}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Meilleures ventes</CardTitle></CardHeader>
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
    </div>
  );
}
