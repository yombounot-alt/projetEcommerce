import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as statisticsService from "../services/statistics.service";

/** Role-aware: a seller only ever sees an overview scoped to their own items (marketplace isolation). */
export const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
  const overview =
    req.user!.role === "seller"
      ? await statisticsService.getSellerDashboardOverview(req.user!.id)
      : await statisticsService.getDashboardOverview();
  res.status(200).json(overview);
});

export const getAdminStatistics = catchAsync(async (_req: Request, res: Response) => {
  const stats = await statisticsService.getAdminStatistics();
  res.status(200).json(stats);
});

export const getSellerStatistics = catchAsync(async (req: Request, res: Response) => {
  const stats = await statisticsService.getSellerStatistics(req.user!.id);
  res.status(200).json(stats);
});
