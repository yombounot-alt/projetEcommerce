import { mockOrders } from "./orders";
import { mockProducts } from "./products";
import { mockUsers } from "./users";
import type { DashboardOverview, RevenuePoint, TopProductStat } from "@/types/dashboard.types";

function buildRevenueSeries(days: number): RevenuePoint[] {
  const series: RevenuePoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayKey = date.toISOString().slice(0, 10);

    const ordersOfDay = mockOrders.filter((o) => o.createdAt.slice(0, 10) === dayKey);
    const revenue = ordersOfDay.reduce((sum, o) => sum + o.total, 0);

    series.push({
      date: dayKey,
      revenue: Number(revenue.toFixed(2)),
      orders: ordersOfDay.length,
    });
  }

  return series;
}

function buildTopProducts(limit = 5): TopProductStat[] {
  const salesByProduct = new Map<string, { unitsSold: number; revenue: number }>();

  for (const order of mockOrders) {
    for (const item of order.items) {
      const current = salesByProduct.get(item.productId) ?? { unitsSold: 0, revenue: 0 };
      current.unitsSold += item.quantity;
      current.revenue += item.subtotal;
      salesByProduct.set(item.productId, current);
    }
  }

  return [...salesByProduct.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)
    .map(([productId, stats]) => {
      const product = mockProducts.find((p) => p.id === productId);
      return {
        productId,
        name: product?.name ?? "Produit supprimé",
        image: product?.images[0] ?? "",
        unitsSold: stats.unitsSold,
        revenue: Number(stats.revenue.toFixed(2)),
      };
    });
}

export function getDashboardOverview(): DashboardOverview {
  const totalRevenue = mockOrders.reduce((sum, o) => sum + o.total, 0);
  const last30 = buildRevenueSeries(30);
  const totalOrders = mockOrders.length;
  const totalCustomers = mockUsers.filter((u) => u.role === "customer").length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    kpis: [
      { label: "Chiffre d'affaires", value: Number(totalRevenue.toFixed(2)), previousValue: Number((totalRevenue * 0.88).toFixed(2)), format: "currency" },
      { label: "Commandes", value: totalOrders, previousValue: Math.round(totalOrders * 0.92), format: "number" },
      { label: "Clients actifs", value: totalCustomers, previousValue: Math.round(totalCustomers * 0.95), format: "number" },
      { label: "Panier moyen", value: Number(avgOrderValue.toFixed(2)), previousValue: Number((avgOrderValue * 0.97).toFixed(2)), format: "currency" },
    ],
    revenueSeries: last30,
    topProducts: buildTopProducts(),
  };
}
