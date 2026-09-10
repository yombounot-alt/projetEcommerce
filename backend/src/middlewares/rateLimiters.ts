import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/** Generic API-wide limiter, generous enough for normal browsing/admin usage. */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de requêtes, veuillez réessayer plus tard.", code: "RATE_LIMITED" },
});

/** Strict limiter for credential-guessing-prone endpoints: login, register, password reset. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Trop de tentatives, veuillez réessayer plus tard.", code: "RATE_LIMITED_AUTH" },
});

/** OTP send/verify: tightly limited to prevent SMS bombing and brute-force guessing. */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de demandes de code OTP, veuillez réessayer plus tard.", code: "RATE_LIMITED_OTP" },
});

/** Payment initialize/webhook endpoints: limited to blunt abuse without blocking legitimate checkout bursts. */
export const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de requêtes de paiement, veuillez réessayer plus tard.",
    code: "RATE_LIMITED_PAYMENT",
  },
});
