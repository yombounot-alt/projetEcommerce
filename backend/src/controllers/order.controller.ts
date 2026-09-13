import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as orderService from "../services/order.service";

export const list = catchAsync(async (req: Request, res: Response) => {
  const scope =
    req.user!.role === "customer"
      ? { customerId: req.user!.id }
      : req.user!.role === "seller"
        ? { sellerId: req.user!.id }
        : {};
  const result = await orderService.listOrders(req.query as orderService.OrderListFilters, scope);
  res.status(200).json(result);
});

export const listMine = catchAsync(async (req: Request, res: Response) => {
  const orders = await orderService.listOrdersByCustomer(req.user!.id);
  res.status(200).json(orders);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(req.params.id, req.user!);
  res.status(200).json(order);
});

export const getByNumber = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.getOrderByNumber(req.params.orderNumber, req.user!);
  res.status(200).json(order);
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.id, req.body);
  res.status(201).json(order);
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.user!,
    req.body.status,
    req.body.reason,
  );
  res.status(200).json(order);
});
