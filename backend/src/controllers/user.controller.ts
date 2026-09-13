import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as userService from "../services/user.service";
import { recordAudit } from "../services/audit.service";

export const list = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.listUsers(req.query as userService.UserListFilters);
  res.status(200).json(result);
});

export const listSellerCustomers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.listSellerCustomers(
    req.user!.id,
    req.query as userService.UserListFilters,
  );
  res.status(200).json(result);
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json(user);
});

export const updateRole = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUserRole(req.params.id, req.body.role, req.user!.id);
  await recordAudit({
    actorId: req.user!.id,
    action: "USER_ROLE_CHANGED",
    resource: "User",
    resourceId: req.params.id,
    metadata: { role: req.body.role },
    req,
  });
  res.status(200).json(user);
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.updateUserStatus(req.params.id, req.body.status);
  await recordAudit({
    actorId: req.user!.id,
    action: "USER_STATUS_CHANGED",
    resource: "User",
    resourceId: req.params.id,
    metadata: { status: req.body.status },
    req,
  });
  res.status(200).json(user);
});
