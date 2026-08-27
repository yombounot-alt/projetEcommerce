import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardOverviewQuery } from "@/features/dashboard/api/useDashboardOverviewQuery";
import { formatDate, formatPrice } from "@/utils/format";

export default function SellerAnalyticsPage() {
  const { data, isLoading } = useDashboardOverviewQuery();

  if (isLoading || !data) return <LoadingState className="min-h-[50vh]" label="Chargement des statistiques…" />;

  return (
    <div className="space-y-6">
      <Seo title="Analytique" noIndex />
      <PageHeader title="Analytique" description="Analysez les performances de vos ventes." />

      <Card>
        <CardHeader><CardTitle>Commandes par jour (30 derniers jours)</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => formatDate(value, { day: "2-digit", month: "2-digit", year: undefined })}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(value, name) => (name === "revenue" ? formatPrice(Number(value ?? 0)) : String(value ?? ""))}
                labelFormatter={(label) => formatDate(String(label))}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="orders" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
