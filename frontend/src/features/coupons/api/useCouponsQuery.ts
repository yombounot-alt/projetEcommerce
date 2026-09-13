import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { couponService, type CouponListFilters } from "@/api/services/coupon.service";
import { queryKeys } from "@/api/query-keys";

export function useCouponsQuery(filters: CouponListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.coupons.list(filters),
    queryFn: () => couponService.list(filters),
    placeholderData: keepPreviousData,
  });
}
