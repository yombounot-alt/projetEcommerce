import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type Role } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../utils/AppError";
import { User } from "../models/User";
import { catchAsync } from "../utils/catchAsync";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return null;
}

/**
 * Verifies the access token and re-checks the user's live state (status, tokenVersion)
 * so a suspended account or a globally revoked session is rejected immediately, not just
 * once the (short-lived) access token happens to expire.
 */
export const authenticate = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    throw new UnauthorizedError("Authentification requise", "NO_TOKEN");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Jeton d'accès invalide ou expiré", "INVALID_TOKEN");
  }

  const user = await User.findById(payload.sub).select("role status tokenVersion");
  if (!user) {
    throw new UnauthorizedError("Cet utilisateur n'existe plus", "USER_NOT_FOUND");
  }
  if (user.status !== "active") {
    throw new ForbiddenError("Ce compte n'est pas actif", "ACCOUNT_INACTIVE");
  }
  if (user.tokenVersion !== payload.tokenVersion) {
    throw new UnauthorizedError("Cette session a été révoquée", "SESSION_REVOKED");
  }

  req.user = { id: user.id as string, role: user.role, tokenVersion: user.tokenVersion };
  next();
});

/** Best-effort authentication: attaches req.user when a valid token is present, never throws. */
export const optionalAuthenticate = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      return next();
    }
    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select("role status tokenVersion");
      if (user && user.status === "active" && user.tokenVersion === payload.tokenVersion) {
        req.user = { id: user.id as string, role: user.role, tokenVersion: user.tokenVersion };
      }
    } catch {
      // ignore invalid token for optional auth
    }
    next();
  },
);

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError("Authentification requise", "NO_TOKEN");
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        "Vous n'avez pas la permission d'effectuer cette action",
        "ROLE_FORBIDDEN",
      );
    }
    next();
  };
}
