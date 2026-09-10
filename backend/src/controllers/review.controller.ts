import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as reviewService from "../services/review.service";

export const listForProduct = catchAsync(async (req: Request, res: Response) => {
  const reviews = await reviewService.listProductReviews(req.params.productId);
  res.status(200).json(reviews);
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.params.productId, req.user!.id, req.body);
  res.status(201).json(review);
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const review = await reviewService.updateReview(req.params.reviewId, req.user!.id, req.body);
  res.status(200).json(review);
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await reviewService.deleteReview(req.params.reviewId, req.user!.id, req.user!.role === "admin");
  res.status(204).send();
});
