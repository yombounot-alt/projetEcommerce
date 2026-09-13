import { useMutation, useQueryClient } from "@tanstack/react-query";
import { couponService } from "@/api/services/coupon.service";
import { queryKeys } from "@/api/query-keys";
import type { CouponInput } from "@/types/coupon.types";

export function useCreateCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CouponInput) => couponService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

export function useUpdateCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<CouponInput> }) =>
      couponService.update(id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}

export function useDeleteCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
  });
}
