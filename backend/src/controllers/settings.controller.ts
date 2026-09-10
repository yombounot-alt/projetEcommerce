import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as settingsService from "../services/settings.service";

export const get = catchAsync(async (_req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  res.status(200).json(settings);
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const settings = await settingsService.updateSettings(req.body);
  res.status(200).json(settings);
});
