import type { OrderListFilters } from "@/api/services/order.service";
import type { UserListFilters } from "@/api/services/user.service";
import type { ProductFilters } from "@/types/product.types";

/**
 * Factory centralisée des clés TanStack Query. Évite les chaînes dupliquées/à la main
 * et garantit une invalidation cohérente entre les mutations et les requêtes.
 */
export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters: ProductFilters) => [...queryKeys.products.all, "list", filters] as const,
    detail: (slug: string) => [...queryKeys.products.all, "detail", slug] as const,
    related: (productId: string) => [...queryKeys.products.all, "related", productId] as const,
    reviews: (productId: string) => [...queryKeys.products.all, "reviews", productId] as const,
    featured: () => [...queryKeys.products.all, "featured"] as const,
    newArrivals: () => [...queryKeys.products.all, "new-arrivals"] as const,
  },
  categories: {
    all: ["categories"] as const,
    detail: (slug: string) => [...queryKeys.categories.all, "detail", slug] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (filters: OrderListFilters) => [...queryKeys.orders.all, "list", filters] as const,
    byCustomer: (customerId: string) => [...queryKeys.orders.all, "customer", customerId] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
    byNumber: (orderNumber: string) => [...queryKeys.orders.all, "number", orderNumber] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters: UserListFilters) => [...queryKeys.users.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
  },
  dashboard: {
    overview: ["dashboard", "overview"] as const,
  },
} as const;
