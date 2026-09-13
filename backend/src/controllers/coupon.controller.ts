import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as couponService from "../services/coupon.service";

export const preview = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.applyCouponPreview(req.body.code, req.body.subtotal);
  res.status(200).json(coupon);
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as { page?: string; pageSize?: string };
  const result = await couponService.listCoupons(
    page ? Number(page) : undefined,
    pageSize ? Number(pageSize) : undefined,
  );
  res.status(200).json(result);
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.body);
  res.status(201).json(coupon);
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  res.status(200).json(coupon);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await couponService.deleteCoupon(req.params.id);
  res.status(204).send();
});
