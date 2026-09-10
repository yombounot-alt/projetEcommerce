import winston from "winston";
import { isProduction, isTest } from "../config/env";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "secret",
  "otp",
  "apiKey",
  "cardNumber",
  "cvv",
];

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    const clone: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      clone[key] = SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))
        ? "[REDACTED]"
        : redact(val);
    }
    return clone;
  }
  return value;
}

const redactFormat = winston.format((info) => {
  const { level, message, timestamp, ...rest } = info;
  return { level, message, timestamp, ...(redact(rest) as object) };
});

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  // Plain (non-colorized) output everywhere: winston's colorize() format depends on
  // @colors/colors' prototype extensions, which are unreliable across environments/module
  // loaders (crashes with "colors[...] is not a function" in some installs) — not worth
  // the fragility for what is purely a cosmetic dev-console convenience.
  format: winston.format.combine(winston.format.timestamp(), redactFormat(), winston.format.json()),
  transports: [new winston.transports.Console({ silent: isTest })],
});
