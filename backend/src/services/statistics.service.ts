import mongoose, { Types } from "mongoose";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { Payment } from "../models/Payment";

const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered"];

function daysAgo(n: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - n);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function computeRevenue(since: Date, until?: Date): Promise<number> {
  const match: Record<string, unknown> = {
    status: { $in: REVENUE_STATUSES },
    createdAt: { $gte: since },
  };
  if (until) (match.createdAt as Record<string, unknown>).$lt = until;

  const [result] = await Order.aggregate<{ total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);
  return result?.total ?? 0;
}

/** Matches the frontend's DashboardOverview contract exactly (kpis, revenueSeries, topProducts). */
export async function getDashboardOverview() {
  const now = new Date();
  const last30 = daysAgo(30);
  const prev30Start = daysAgo(60);

  const [
    currentRevenue,
    previousRevenue,
    currentOrders,
    previousOrders,
    currentCustomers,
    previousCustomers,
  ] = await Promise.all([
    computeRevenue(last30),
    computeRevenue(prev30Start, last30),
    Order.countDocuments({ createdAt: { $gte: last30 } }),
    Order.countDocuments({ createdAt: { $gte: prev30Start, $lt: last30 } }),
    User.countDocuments({ role: "customer", createdAt: { $gte: last30 } }),
    User.countDocuments({ role: "customer", createdAt: { $gte: prev30Start, $lt: last30 } }),
  ]);

  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: currentRevenue,
      previousValue: previousRevenue,
      format: "currency" as const,
    },
    {
      label: "Commandes",
      value: currentOrders,
      previousValue: previousOrders,
      format: "number" as const,
    },
    {
      label: "Nouveaux clients",
      value: currentCustomers,
      previousValue: previousCustomers,
      format: "number" as const,
    },
  ];

  const revenueByDay = await Order.aggregate<{ _id: string; revenue: number; orders: number }>([
    { $match: { status: { $in: REVENUE_STATUSES }, createdAt: { $gte: last30 } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const revenueSeries = revenueByDay.map((r) => ({
    date: r._id,
    revenue: r.revenue,
    orders: r.orders,
  }));

  const topProductsAgg = await Order.aggregate<{
    _id: string;
    name: string;
    image: string;
    unitsSold: number;
    revenue: number;
  }>([
    { $match: { status: { $in: REVENUE_STATUSES }, createdAt: { $gte: last30 } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.productName" },
        image: { $first: "$items.productImage" },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.subtotal" },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
  ]);

  const topProducts = topProductsAgg.map((p) => ({
    productId: String(p._id),
    name: p.name,
    image: p.image,
    unitsSold: p.unitsSold,
    revenue: p.revenue,
  }));

  void now;
  return { kpis, revenueSeries, topProducts };
}

/**
 * Seller-scoped equivalent of getDashboardOverview() — same contract (kpis, revenueSeries,
 * topProducts) so the frontend dashboard/analytics widgets need no changes, but every figure
 * is restricted to this seller's own items (marketplace isolation, mirrors getSellerStatistics).
 */
export async function getSellerDashboardOverview(sellerId: string) {
  const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
  const last30 = daysAgo(30);
  const prev30Start = daysAgo(60);

  function sellerMatch(since: Date, until?: Date): Record<string, unknown> {
    const createdAt: Record<string, unknown> = { $gte: since };
    if (until) createdAt.$lt = until;
    return { status: { $in: REVENUE_STATUSES }, createdAt, "items.seller": sellerObjectId };
  }

  async function sellerRevenueAndUnits(
    since: Date,
    until?: Date,
  ): Promise<{ revenue: number; units: number }> {
    const [result] = await Order.aggregate<{ revenue: number; units: number }>([
      { $match: sellerMatch(since, until) },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerObjectId } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$items.subtotal" },
          units: { $sum: "$items.quantity" },
        },
      },
    ]);
    return { revenue: result?.revenue ?? 0, units: result?.units ?? 0 };
  }

  const [current, previous, currentOrders, previousOrders] = await Promise.all([
    sellerRevenueAndUnits(last30),
    sellerRevenueAndUnits(prev30Start, last30),
    Order.countDocuments(sellerMatch(last30)),
    Order.countDocuments(sellerMatch(prev30Start, last30)),
  ]);

  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: current.revenue,
      previousValue: previous.revenue,
      format: "currency" as const,
    },
    {
      label: "Commandes",
      value: currentOrders,
      previousValue: previousOrders,
      format: "number" as const,
    },
    {
      label: "Unités vendues",
      value: current.units,
      previousValue: previous.units,
      format: "number" as const,
    },
  ];

  const revenueByDayAgg = await Order.aggregate<{
    _id: string;
    revenue: number;
    orderIds: Types.ObjectId[];
  }>([
    { $match: sellerMatch(last30) },
    { $unwind: "$items" },
    { $match: { "items.seller": sellerObjectId } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$items.subtotal" },
        orderIds: { $addToSet: "$_id" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const revenueSeries = revenueByDayAgg.map((r) => ({
    date: r._id,
    revenue: r.revenue,
    orders: r.orderIds.length,
  }));

  const topProductsAgg = await Order.aggregate<{
    _id: string;
    name: string;
    image: string;
    unitsSold: number;
    revenue: number;
  }>([
    { $match: sellerMatch(last30) },
    { $unwind: "$items" },
    { $match: { "items.seller": sellerObjectId } },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.productName" },
        image: { $first: "$items.productImage" },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.subtotal" },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
  ]);

  const topProducts = topProductsAgg.map((p) => ({
    productId: String(p._id),
    name: p.name,
    image: p.image,
    unitsSold: p.unitsSold,
    revenue: p.revenue,
  }));

  return { kpis, revenueSeries, topProducts };
}

/** Broader admin statistics beyond the dashboard widget contract (section 27). */
export async function getAdminStatistics() {
  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalSellers,
    totalProducts,
    successfulPayments,
    failedPayments,
    lowStockProducts,
  ] = await Promise.all([
    computeRevenue(new Date(0)),
    Order.countDocuments(),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "seller" }),
    Product.countDocuments(),
    Payment.countDocuments({ status: "captured" }),
    Payment.countDocuments({ status: "failed" }),
    Product.countDocuments({ $expr: { $lte: ["$availableStock", "$lowStockThreshold"] } }),
  ]);

  return {
    revenue: totalRevenue,
    orders: totalOrders,
    customers: totalCustomers,
    sellers: totalSellers,
    products: totalProducts,
    successfulPayments,
    failedPayments,
    lowStockProducts,
  };
}

/** Seller-scoped statistics — never exposes another seller's data (marketplace isolation). */
export async function getSellerStatistics(sellerId: string) {
  const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
  const [revenueAgg, totalOrders, totalProducts, lowStockProducts] = await Promise.all([
    Order.aggregate<{ total: number }>([
      { $match: { status: { $in: REVENUE_STATUSES }, "items.seller": sellerObjectId } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerObjectId } },
      { $group: { _id: null, total: { $sum: "$items.subtotal" } } },
    ]),
    Order.countDocuments({ "items.seller": sellerId }),
    Product.countDocuments({ seller: sellerId }),
    Product.countDocuments({
      seller: sellerId,
      $expr: { $lte: ["$availableStock", "$lowStockThreshold"] },
    }),
  ]);

  return {
    revenue: revenueAgg[0]?.total ?? 0,
    orders: totalOrders,
    products: totalProducts,
    lowStockProducts,
  };
}
