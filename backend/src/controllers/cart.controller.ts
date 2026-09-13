import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as cartService from "../services/cart.service";

export const getCart = catchAsync(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.id);
  res.status(200).json(cart);
});

export const addItem = catchAsync(async (req: Request, res: Response) => {
  const cart = await cartService.addCartItem(
    req.user!.id,
    req.body.productId,
    req.body.quantity,
    req.body.variantId,
  );
  res.status(201).json(cart);
});

export const updateItem = catchAsync(async (req: Request, res: Response) => {
  const cart = await cartService.updateCartItem(
    req.user!.id,
    req.params.productId,
    req.body.quantity,
    req.body.variantId,
  );
  res.status(200).json(cart);
});

export const removeItem = catchAsync(async (req: Request, res: Response) => {
  const cart = await cartService.removeCartItem(
    req.user!.id,
    req.params.productId,
    req.query.variantId as string | undefined,
  );
  res.status(200).json(cart);
});

export const clear = catchAsync(async (req: Request, res: Response) => {
  await cartService.clearCart(req.user!.id);
  res.status(204).send();
});
