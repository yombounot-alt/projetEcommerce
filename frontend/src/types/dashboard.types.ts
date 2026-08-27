export interface DashboardKpi {
  label: string;
  value: number;
  previousValue: number;
  format: "currency" | "number" | "percentage";
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProductStat {
  productId: string;
  name: string;
  image: string;
  unitsSold: number;
  revenue: number;
}

export interface DashboardOverview {
  kpis: DashboardKpi[];
  revenueSeries: RevenuePoint[];
  topProducts: TopProductStat[];
}
