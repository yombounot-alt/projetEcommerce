import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import {
  EXPRESS_SHIPPING_COST,
  FREE_SHIPPING_THRESHOLD,
  PAGE_SIZE_DEFAULT,
  STANDARD_SHIPPING_COST,
} from "@/constants/app.constants";
import { mockDelay } from "@/lib/mock-delay";
import { getOrderById, getOrderByNumber, getOrdersByCustomer, mockOrders } from "@/mocks/orders";
import { mockProducts } from "@/mocks/products";
import { useAuthStore } from "@/store/authStore";
import type { PaginatedResponse } from "@/types/common.types";
import type { Coupon, Order, OrderStatus } from "@/types/order.types";
import { formatPrice } from "@/utils/format";

/** Sous-ensemble d'Address attendu par le backend pour une commande (voir orderAddressSchema) — pas d'id/isDefault, ce sont des concepts propres au carnet d'adresses du client. */
export interface CreateOrderAddress {
  label?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
}

/**
 * Payload de checkout tel qu'attendu par POST /orders : le serveur recalcule toujours
 * prix, stock et totaux à partir de MongoDB (jamais depuis le client), donc on ne lui
 * envoie que l'identité produit/quantité — pas de prix, nom ou image côté client.
 */
export interface CreateOrderPayload {
  items: { productId: string; variantId?: string; quantity: number }[];
  shippingAddress: CreateOrderAddress;
  billingAddress?: CreateOrderAddress;
  shippingMethod: "standard" | "express";
  couponCode?: string;
  paymentMethod: Order["payment"]["method"];
  notes?: string;
}

const KNOWN_COUPONS: {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minSubtotal?: number;
}[] = [
  { code: "WELCOME10", type: "percentage", value: 10 },
  { code: "FREESHIP", type: "fixed", value: STANDARD_SHIPPING_COST },
];

export interface OrderListFilters {
  status?: OrderStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

function filterOrders(filters: OrderListFilters): Order[] {
  let results = [...mockOrders];

  if (filters.status) {
    results = results.filter((o) => o.status === filters.status);
  }

  if (filters.search) {
    const query = filters.search.trim().toLowerCase();
    results = results.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.customerEmail.toLowerCase().includes(query),
    );
  }

  return results;
}

export const orderService = {
  async list(filters: OrderListFilters = {}): Promise<PaginatedResponse<Order>> {
    if (env.useMocks) {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? PAGE_SIZE_DEFAULT;
      const filtered = filterOrders(filters);
      const start = (page - 1) * pageSize;

      return mockDelay({
        items: filtered.slice(start, start + pageSize),
        pagination: {
          page,
          pageSize,
          totalItems: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        },
      });
    }
    const { data } = await httpClient.get<PaginatedResponse<Order>>("/orders", { params: filters });
    return data;
  },

  async listByCustomer(customerId: string): Promise<Order[]> {
    if (env.useMocks) {
      return mockDelay(getOrdersByCustomer(customerId));
    }
    const { data } = await httpClient.get<Order[]>(`/customers/${customerId}/orders`);
    return data;
  },

  async getById(id: string): Promise<Order | null> {
    if (env.useMocks) {
      return mockDelay(getOrderById(id) ?? null, 250);
    }
    const { data } = await httpClient.get<Order>(`/orders/${id}`);
    return data;
  },

  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    if (env.useMocks) {
      return mockDelay(getOrderByNumber(orderNumber) ?? null, 250);
    }
    const { data } = await httpClient.get<Order>(`/orders/number/${orderNumber}`);
    return data;
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    if (env.useMocks) {
      // Miroir du comportement serveur réel : prix/nom/image sont toujours relus depuis le
      // catalogue (mockProducts), jamais acceptés depuis le payload — seuls productId/quantity
      // y figurent, exactement comme le contrat de POST /orders côté backend.
      const user = useAuthStore.getState().user;
      const items = payload.items.map((line, index) => {
        const product = mockProducts.find((p) => p.id === line.productId);
        const variant = line.variantId
          ? product?.variants.find((v) => v.id === line.variantId)
          : undefined;
        const unitPrice = variant?.price ?? product?.price ?? 0;
        return {
          id: `item-${Date.now()}-${index}`,
          productId: line.productId,
          variantId: variant?.id,
          variantLabel: variant ? Object.values(variant.attributes).join(" / ") : undefined,
          productName: product?.name ?? "Produit",
          productImage: variant?.image ?? product?.images[0] ?? "",
          sku: variant?.sku ?? product?.sku ?? line.productId,
          unitPrice,
          quantity: line.quantity,
          subtotal: Number((unitPrice * line.quantity).toFixed(2)),
        };
      });

      const subtotal = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
      const shippingCost =
        subtotal >= FREE_SHIPPING_THRESHOLD
          ? 0
          : payload.shippingMethod === "express"
            ? EXPRESS_SHIPPING_COST
            : STANDARD_SHIPPING_COST;
      const coupon = payload.couponCode
        ? KNOWN_COUPONS.find((c) => c.code === payload.couponCode)
        : undefined;
      const discount = coupon
        ? Number(
            Math.min(
              coupon.type === "percentage" ? subtotal * (coupon.value / 100) : coupon.value,
              subtotal,
            ).toFixed(2),
          )
        : 0;
      const total = Number((subtotal + shippingCost - discount).toFixed(2));
      const shippingAddress = {
        id: "temp",
        isDefault: false,
        label: "Shipping",
        ...payload.shippingAddress,
      };
      const billingAddress = payload.billingAddress
        ? { id: "temp-billing", isDefault: false, label: "Billing", ...payload.billingAddress }
        : { ...shippingAddress, id: "temp-billing" };

      const order: Order = {
        id: `order-${Date.now()}`,
        orderNumber: `LUM-${Math.floor(100000 + Math.random() * 899999)}`,
        customerId: user?.id ?? "guest",
        customerName: user ? `${user.firstName} ${user.lastName}` : "Invité",
        customerEmail: user?.email ?? "",
        items,
        status: "pending",
        shippingAddress,
        billingAddress,
        shippingMethod: payload.shippingMethod,
        shippingCost,
        discount,
        couponCode: coupon?.code,
        subtotal,
        total,
        currency: "GNF",
        payment: {
          id: `pay-${Date.now()}`,
          method: payload.paymentMethod,
          status: "pending",
          amount: total,
          currency: "GNF",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockOrders.unshift(order);
      return mockDelay(order, 700);
    }
    const { data } = await httpClient.post<Order>("/orders", payload);
    return data;
  },

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    if (env.useMocks) {
      const order = getOrderById(id);
      if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
      }
      return mockDelay(order ?? null, 300);
    }
    const { data } = await httpClient.patch<Order>(`/orders/${id}/status`, { status });
    return data;
  },

  async applyCoupon(code: string, subtotal: number): Promise<Coupon> {
    if (env.useMocks) {
      const coupon = KNOWN_COUPONS.find((c) => c.code === code.toUpperCase());
      if (!coupon) {
        throw new Error("Code promo invalide ou expiré.");
      }
      if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
        throw new Error(
          `Ce code nécessite un panier minimum de ${formatPrice(coupon.minSubtotal)}.`,
        );
      }
      return mockDelay(coupon, 300);
    }
    const { data } = await httpClient.post<Coupon>("/coupons/apply", { code, subtotal });
    return data;
  },
};
