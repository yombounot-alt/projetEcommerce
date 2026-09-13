import { httpClient } from "@/api/client/axios";
import type { PaginatedResponse } from "@/types/common.types";
import type { Coupon, CouponInput } from "@/types/coupon.types";

export interface CouponListFilters {
  page?: number;
  pageSize?: number;
}

export const couponService = {
  async list(filters: CouponListFilters = {}): Promise<PaginatedResponse<Coupon>> {
    const { data } = await httpClient.get<PaginatedResponse<Coupon>>("/coupons", {
      params: filters,
    });
    return data;
  },

  async create(input: CouponInput): Promise<Coupon> {
    const { data } = await httpClient.post<Coupon>("/coupons", input);
    return data;
  },

  async update(id: string, changes: Partial<CouponInput>): Promise<Coupon> {
    const { data } = await httpClient.patch<Coupon>(`/coupons/${id}`, changes);
    return data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/coupons/${id}`);
  },

  async preview(code: string, subtotal: number): Promise<Coupon> {
    const { data } = await httpClient.post<Coupon>("/coupons/apply", { code, subtotal });
    return data;
  },
};
