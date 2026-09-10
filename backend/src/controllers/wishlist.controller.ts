import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as wishlistService from "../services/wishlist.service";

export const getWishlist = catchAsync(async (req: Request, res: Response) => {
  const items = await wishlistService.getWishlist(req.user!.id);
  res.status(200).json(items);
});

export const addItem = catchAsync(async (req: Request, res: Response) => {
  await wishlistService.addToWishlist(req.user!.id, req.params.productId);
  res.status(204).send();
});

export const removeItem = catchAsync(async (req: Request, res: Response) => {
  await wishlistService.removeFromWishlist(req.user!.id, req.params.productId);
  res.status(204).send();
});
