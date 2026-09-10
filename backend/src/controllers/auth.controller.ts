import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  REFRESH_COOKIE_NAME,
} from "../utils/cookies";
import * as authService from "../services/auth.service";
import { UnauthorizedError } from "../utils/AppError";

function sessionMeta(req: Request) {
  return { userAgent: req.headers["user-agent"], ip: req.ip };
}

function sendSession(
  res: Response,
  status: number,
  user: unknown,
  accessToken: string,
  refreshToken: string,
) {
  setRefreshTokenCookie(res, refreshToken, authService.REFRESH_TOKEN_TTL_MS);
  res.status(status).json({
    user,
    accessToken,
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  });
}

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.body,
    sessionMeta(req),
  );
  sendSession(res, 201, user, accessToken, refreshToken);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(
    email,
    password,
    sessionMeta(req),
  );
  sendSession(res, 200, user, accessToken, refreshToken);
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const rawToken = req.signedCookies?.[REFRESH_COOKIE_NAME] ?? req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawToken) {
    throw new UnauthorizedError("Aucun jeton de rafraîchissement fourni", "NO_REFRESH_TOKEN");
  }
  const { user, accessToken, refreshToken } = await authService.refreshSession(
    rawToken,
    sessionMeta(req),
  );
  sendSession(res, 200, user, accessToken, refreshToken);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const rawToken = req.signedCookies?.[REFRESH_COOKIE_NAME] ?? req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout(rawToken);
  clearRefreshTokenCookie(res);
  res.status(204).send();
});

export const logoutAll = catchAsync(async (req: Request, res: Response) => {
  await authService.logoutAllSessions(req.user!.id);
  clearRefreshTokenCookie(res);
  res.status(204).send();
});

export const me = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.status(200).json(user);
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.user!.id, req.body);
  res.status(200).json(user);
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const { user, accessToken, refreshToken } = await authService.changePassword(
    req.user!.id,
    currentPassword,
    newPassword,
    sessionMeta(req),
  );
  sendSession(res, 200, user, accessToken, refreshToken);
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res
    .status(200)
    .json({ message: "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé." });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({ message: "Votre mot de passe a été réinitialisé avec succès." });
});

export const requestEmailVerification = catchAsync(async (req: Request, res: Response) => {
  await authService.requestEmailVerification(req.user!.id);
  res.status(200).json({ message: "Email de vérification envoyé." });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);
  res.status(200).json({ message: "Email vérifié avec succès." });
});

export const listAddresses = catchAsync(async (req: Request, res: Response) => {
  const addresses = await authService.listAddresses(req.user!.id);
  res.status(200).json(addresses);
});

export const addAddress = catchAsync(async (req: Request, res: Response) => {
  const address = await authService.addAddress(req.user!.id, req.body);
  res.status(201).json(address);
});

export const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const address = await authService.updateAddress(req.user!.id, req.params.addressId, req.body);
  res.status(200).json(address);
});

export const deleteAddress = catchAsync(async (req: Request, res: Response) => {
  await authService.deleteAddress(req.user!.id, req.params.addressId);
  res.status(204).send();
});
