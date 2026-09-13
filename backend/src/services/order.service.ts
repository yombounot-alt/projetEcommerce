import mongoose from "mongoose";
import { Order, type IOrder, type IOrderAddress, type OrderStatus } from "../models/Order";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/AppError";
import { generateOrderNumber } from "../utils/generateCode";
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from "../utils/pagination";
import { reserveStock, releaseStock } from "./stock.service";
import { computeDiscount, computeShippingCost } from "../constants/shipping";
import { validateCoupon, incrementCouponUsage } from "./coupon.service";
import { createNotification } from "./notification.service";
import { recordAudit } from "./audit.service";
import { notifyOwnerNewOrder, notifyCustomerOrderConfirmed } from "./orderNotification.service";
import { isManualPaymentMethod } from "../integrations/payment/payment.service";
import type { Role } from "../utils/jwt";

export interface OrderItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

function formatVariantLabel(attributes: Record<string, string>): string {
  return Object.values(attributes).join(" / ");
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  shippingAddress: Omit<IOrderAddress, "label"> & { label?: string };
  billingAddress?: Omit<IOrderAddress, "label"> & { label?: string };
  shippingMethod: "standard" | "express";
  couponCode?: string;
  paymentMethod: IOrder["payment"]["method"];
  notes?: string;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    id: string;
    productId: string;
    variantId?: string;
    variantLabel?: string;
    productName: string;
    productImage: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  status: OrderStatus;
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  shippingMethod: string;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  subtotal: number;
  total: number;
  currency: string;
  payment: {
    id: string;
    method: string;
    status: string;
    amount: number;
    currency: string;
    processedAt?: Date;
    providerReference?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export function toOrderDTO(order: IOrder): OrderDTO {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    customerId: String(order.customer),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: order.items.map((item) => ({
      id: String(item._id),
      productId: String(item.product),
      variantId: item.variant ? String(item.variant) : undefined,
      variantLabel: item.variantLabel,
      productName: item.productName,
      productImage: item.productImage,
      sku: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    status: order.status,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    shippingMethod: order.shippingMethod,
    shippingCost: order.shippingCost,
    discount: order.discount,
    couponCode: order.couponCode,
    subtotal: order.subtotal,
    total: order.total,
    currency: order.currency,
    payment: {
      id: order.payment.payment ? String(order.payment.payment) : "",
      method: order.payment.method,
      status: order.payment.status,
      amount: order.payment.amount,
      currency: order.payment.currency,
      processedAt: order.payment.processedAt,
      providerReference: order.payment.providerReference,
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * Full checkout flow (rule 17): validates products live from MongoDB (never the client's
 * price), reserves stock atomically inside a transaction, then creates the order. Payment
 * initialization happens in a second step (see payment.service.ts) so a slow/unavailable
 * external gateway never holds a DB transaction open.
 */
export async function createOrder(userId: string, input: CreateOrderInput): Promise<OrderDTO> {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("Utilisateur introuvable", "USER_NOT_FOUND");

  if (input.items.length === 0) {
    throw new BadRequestError("La commande doit contenir au moins un article", "EMPTY_ORDER");
  }

  const productIds = input.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product || product.status !== "published") {
      throw new NotFoundError(
        `Le produit ${item.productId} n'est pas disponible`,
        "PRODUCT_NOT_FOUND",
      );
    }
    if (product.variants.length > 0 && !item.variantId) {
      throw new BadRequestError(
        `Veuillez sélectionner une variante pour "${product.name}"`,
        "VARIANT_REQUIRED",
      );
    }
    if (item.variantId) {
      const variant = product.variants.find((v) => String(v._id) === item.variantId);
      if (!variant) {
        throw new NotFoundError(`Variante introuvable pour "${product.name}"`, "VARIANT_NOT_FOUND");
      }
      if (variant.availableStock < item.quantity) {
        throw new BadRequestError(`Stock insuffisant pour "${product.name}"`, "INSUFFICIENT_STOCK");
      }
    } else if (product.availableStock < item.quantity) {
      throw new BadRequestError(`Stock insuffisant pour "${product.name}"`, "INSUFFICIENT_STOCK");
    }
  }

  const orderItems = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const variant = item.variantId
      ? product.variants.find((v) => String(v._id) === item.variantId)
      : undefined;
    const unitPrice = variant?.price ?? product.price;
    const subtotal = Number((unitPrice * item.quantity).toFixed(2));
    return {
      product: product._id,
      variant: variant?._id,
      variantLabel: variant ? formatVariantLabel(variant.attributes) : undefined,
      seller: product.seller,
      productName: product.name,
      productImage: variant?.image ?? product.images[0] ?? "",
      sku: variant?.sku ?? product.sku,
      unitPrice,
      quantity: item.quantity,
      subtotal,
    };
  });

  const subtotal = Number(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const shippingCost = computeShippingCost(input.shippingMethod, subtotal);
  const coupon = input.couponCode ? await validateCoupon(input.couponCode, subtotal) : undefined;
  const discount = computeDiscount(coupon, subtotal);
  const total = Number((subtotal + shippingCost - discount).toFixed(2));

  const shippingAddress: IOrderAddress = { label: "Shipping", ...input.shippingAddress };
  const billingAddress: IOrderAddress = input.billingAddress
    ? { label: "Billing", ...input.billingAddress }
    : shippingAddress;

  const session = await mongoose.startSession();
  let order: IOrder | undefined;
  try {
    await session.withTransaction(async () => {
      for (const item of input.items) {
        await reserveStock(
          item.productId,
          item.quantity,
          { reason: "Order checkout reservation", actorId: userId, session },
          item.variantId,
        );
      }

      const [created] = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            customer: user._id,
            customerName: `${user.firstName} ${user.lastName}`,
            customerEmail: user.email,
            items: orderItems,
            status: "pending",
            shippingAddress,
            billingAddress,
            shippingMethod: input.shippingMethod,
            shippingCost,
            discount,
            couponCode: coupon?.code,
            subtotal,
            total,
            currency: "GNF",
            payment: {
              method: input.paymentMethod,
              status: "pending",
              amount: total,
              currency: "GNF",
            },
            notes: input.notes,
          },
        ],
        { session },
      );
      order = created;

      if (coupon) {
        await incrementCouponUsage(coupon.code, session);
      }
    });
  } finally {
    await session.endSession();
  }

  if (!order) {
    throw new BadRequestError("Échec de la création de la commande", "ORDER_CREATION_FAILED");
  }

  await recordAudit({
    actorId: userId,
    action: "ORDER_CREATED",
    resource: "Order",
    resourceId: String(order._id),
  });
  await createNotification({
    userId,
    type: "ORDER",
    title: "Commande passée",
    message: `Votre commande ${order.orderNumber} a été enregistrée et est en attente de confirmation du paiement.`,
    metadata: { orderId: String(order._id) },
  });

  // Manual payment methods (cash on delivery, bank transfer) never go through an online
  // capture step — the order itself is the "confirmed" event the owner needs to act on.
  // Gateway methods (card/paypal/mobile_money) instead notify on payment capture, see
  // initializeOrderPayment/applyWebhookEvent in payment.service.ts.
  if (isManualPaymentMethod(order.payment.method)) {
    await notifyOwnerNewOrder(order);
    await notifyCustomerOrderConfirmed(order);
  }

  return toOrderDTO(order);
}

/** Rolls back a pending order that could not be paid (e.g. gateway unavailable): releases stock, cancels order. */
export async function cancelUnpaidOrder(orderId: string, reason: string): Promise<void> {
  const order = await Order.findById(orderId);
  if (!order || order.status !== "pending") return;

  for (const item of order.items) {
    await releaseStock(
      String(item.product),
      item.quantity,
      { reason: "Order cancelled: " + reason },
      item.variant ? String(item.variant) : undefined,
    );
  }

  order.status = "cancelled";
  order.cancelledReason = reason;
  order.payment.status = "failed";
  await order.save();
}

export interface OrderListFilters {
  status?: OrderStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listOrders(
  filters: OrderListFilters,
  scope: { customerId?: string; sellerId?: string },
): Promise<PaginatedResult<OrderDTO>> {
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (scope.customerId) query.customer = scope.customerId;
  if (scope.sellerId) query["items.seller"] = scope.sellerId;
  if (filters.search) {
    query.$or = [
      { orderNumber: new RegExp(filters.search, "i") },
      { customerName: new RegExp(filters.search, "i") },
      { customerEmail: new RegExp(filters.search, "i") },
    ];
  }

  const { page, pageSize, skip } = normalizePagination(filters.page, filters.pageSize);
  const [items, totalItems] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    Order.countDocuments(query),
  ]);

  return buildPaginatedResult(items.map(toOrderDTO), totalItems, page, pageSize);
}

export async function listOrdersByCustomer(customerId: string): Promise<OrderDTO[]> {
  const orders = await Order.find({ customer: customerId }).sort({ createdAt: -1 });
  return orders.map(toOrderDTO);
}

function assertOrderAccess(order: IOrder, actor: { id: string; role: Role }): void {
  if (actor.role === "admin") return;
  if (actor.role === "customer" && String(order.customer) === actor.id) return;
  if (actor.role === "seller" && order.items.some((item) => String(item.seller) === actor.id))
    return;
  throw new ForbiddenError("Vous n'avez pas accès à cette commande", "ORDER_ACCESS_DENIED");
}

export async function getOrderById(
  orderId: string,
  actor: { id: string; role: Role },
): Promise<OrderDTO> {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Commande introuvable", "ORDER_NOT_FOUND");
  assertOrderAccess(order, actor);
  return toOrderDTO(order);
}

export async function getOrderByNumber(
  orderNumber: string,
  actor: { id: string; role: Role },
): Promise<OrderDTO> {
  const order = await Order.findOne({ orderNumber });
  if (!order) throw new NotFoundError("Commande introuvable", "ORDER_NOT_FOUND");
  assertOrderAccess(order, actor);
  return toOrderDTO(order);
}

export async function getOrderDocOrThrow(orderId: string): Promise<IOrder> {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Commande introuvable", "ORDER_NOT_FOUND");
  return order;
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export async function updateOrderStatus(
  orderId: string,
  actor: { id: string; role: Role },
  status: OrderStatus,
  reason?: string,
): Promise<OrderDTO> {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Commande introuvable", "ORDER_NOT_FOUND");
  assertOrderAccess(order, actor);

  if (actor.role === "customer" && status !== "cancelled") {
    throw new ForbiddenError(
      "Les clients ne peuvent qu'annuler leurs propres commandes",
      "ORDER_STATUS_FORBIDDEN",
    );
  }

  // A seller can fulfill (processing/shipped/delivered) or cancel their own orders, but
  // must never be able to mark one "refunded" directly: that would desync Order.status from
  // the actual Payment, which is only ever refunded through the admin-only refund endpoint
  // (see payment.service.ts#refundPayment, which sets order.status = "refunded" itself once
  // the real refund succeeds).
  if (actor.role === "seller" && status === "refunded") {
    throw new ForbiddenError(
      "Un remboursement doit être initié via le remboursement du paiement, pas en changeant le statut de la commande",
      "ORDER_STATUS_FORBIDDEN",
    );
  }

  if (!VALID_TRANSITIONS[order.status].includes(status)) {
    throw new BadRequestError(
      `Impossible de faire passer la commande de "${order.status}" à "${status}"`,
      "INVALID_ORDER_TRANSITION",
    );
  }

  if (status === "cancelled" && ["pending", "paid"].includes(order.status)) {
    for (const item of order.items) {
      await releaseStock(
        String(item.product),
        item.quantity,
        { reason: "Order cancelled", actorId: actor.id, orderId: String(order._id) },
        item.variant ? String(item.variant) : undefined,
      );
    }
  }

  order.status = status;
  if (reason) order.cancelledReason = reason;
  await order.save();

  await recordAudit({
    actorId: actor.id,
    action: "ORDER_STATUS_CHANGED",
    resource: "Order",
    resourceId: String(order._id),
    metadata: { status },
  });
  await createNotification({
    userId: String(order.customer),
    type: "ORDER",
    title: "Statut de commande mis à jour",
    message: `Votre commande ${order.orderNumber} est maintenant "${status}".`,
    metadata: { orderId: String(order._id), status },
  });

  return toOrderDTO(order);
}
