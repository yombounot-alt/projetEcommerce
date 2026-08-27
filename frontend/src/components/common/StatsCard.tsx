import { TrendingDownIcon, TrendingUpIcon, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercentage, formatPrice } from "@/utils/format";
import type { DashboardKpi } from "@/types/dashboard.types";

function formatValue(value: number, format: DashboardKpi["format"]): string {
  if (format === "currency") return formatPrice(value);
  if (format === "percentage") return formatPercentage(value);
  return formatNumber(value);
}

interface StatsCardProps {
  kpi: DashboardKpi;
  icon?: LucideIcon;
}

export function StatsCard({ kpi, icon: Icon }: StatsCardProps) {
  const variation = kpi.previousValue === 0 ? 0 : ((kpi.value - kpi.previousValue) / kpi.previousValue) * 100;
  const isPositive = variation >= 0;

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{kpi.label}</p>
          <p className="font-heading text-2xl font-semibold text-foreground">
            {formatValue(kpi.value, kpi.format)}
          </p>
          <div className={cn("flex items-center gap-1 text-xs font-medium", isPositive ? "text-success" : "text-destructive")}>
            {isPositive ? <TrendingUpIcon className="size-3.5" /> : <TrendingDownIcon className="size-3.5" />}
            <span>{formatPercentage(Math.abs(variation))} vs période précédente</span>
          </div>
        </div>
        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <Icon className="size-5 text-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
