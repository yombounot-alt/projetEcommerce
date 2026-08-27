import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { PAGE_SIZE_DEFAULT } from "@/constants/app.constants";
import { mockDelay } from "@/lib/mock-delay";
import { getOrderById, getOrderByNumber, getOrdersByCustomer, mockOrders } from "@/mocks/orders";
import type { PaginatedResponse } from "@/types/common.types";
import type { CartItem, Coupon, Order, OrderStatus } from "@/types/order.types";
import type { Address } from "@/types/user.types";

export interface CreateOrderPayload {
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: string;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  paymentMethod: Order["payment"]["method"];
}

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
      const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const order: Order = {
        id: `order-${Date.now()}`,
        orderNumber: `LUM-${Math.floor(100000 + Math.random() * 899999)}`,
        customerId: payload.customerId,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        items: payload.items.map((item, index) => ({
          id: `item-${Date.now()}-${index}`,
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          sku: item.productId,
          unitPrice: item.price,
          quantity: item.quantity,
          subtotal: Number((item.price * item.quantity).toFixed(2)),
        })),
        status: "pending",
        shippingAddress: payload.shippingAddress,
        billingAddress: payload.billingAddress,
        shippingMethod: payload.shippingMethod,
        shippingCost: payload.shippingCost,
        discount: payload.discount,
        couponCode: payload.couponCode,
        subtotal: Number(subtotal.toFixed(2)),
        total: Number((subtotal + payload.shippingCost - payload.discount).toFixed(2)),
        currency: "GNF",
        payment: {
          id: `pay-${Date.now()}`,
          method: payload.paymentMethod,
          status: "captured",
          amount: Number((subtotal + payload.shippingCost - payload.discount).toFixed(2)),
          currency: "GNF",
          processedAt: new Date().toISOString(),
          providerReference: `ref_${Math.random().toString(36).slice(2, 12)}`,
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
      const knownCoupons: Coupon[] = [
        { code: "WELCOME10", type: "percentage", value: 10 },
        { code: "FREESHIP", type: "fixed", value: 4.99 },
      ];
      const coupon = knownCoupons.find((c) => c.code === code.toUpperCase());
      if (!coupon) {
        throw new Error("Code promo invalide ou expiré.");
      }
      if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
        throw new Error(`Ce code nécessite un panier minimum de ${coupon.minSubtotal} €.`);
      }
      return mockDelay(coupon, 300);
    }
    const { data } = await httpClient.post<Coupon>("/coupons/apply", { code, subtotal });
    return data;
  },
};
