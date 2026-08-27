import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { orderService, type OrderListFilters } from "@/api/services/order.service";
import { queryKeys } from "@/api/query-keys";

export function useOrdersQuery(filters: OrderListFilters) {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => orderService.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCustomerOrdersQuery(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.byCustomer(customerId ?? ""),
    queryFn: () => orderService.listByCustomer(customerId as string),
    enabled: Boolean(customerId),
  });
}

export function useOrderQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: () => orderService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useOrderByNumberQuery(orderNumber: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.byNumber(orderNumber ?? ""),
    queryFn: () => orderService.getByOrderNumber(orderNumber as string),
    enabled: Boolean(orderNumber),
  });
}
