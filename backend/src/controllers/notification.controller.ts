import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as notificationService from "../services/notification.service";

export const list = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as { page?: string; pageSize?: string };
  const result = await notificationService.listNotifications(
    req.user!.id,
    page ? Number(page) : undefined,
    pageSize ? Number(pageSize) : undefined,
  );
  res.status(200).json(result);
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationService.markNotificationAsRead(
    req.user!.id,
    req.params.id,
  );
  res.status(200).json(notification);
});

export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAllNotificationsAsRead(req.user!.id);
  res.status(204).send();
});
