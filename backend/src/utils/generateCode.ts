import crypto from "crypto";

export function generateOrderNumber(): string {
  const random = Math.floor(100000 + Math.random() * 899999);
  return `LUM-${random}`;
}

export function generateSku(prefix = "SKU"): string {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export function generateOtp(length = 6): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(crypto.randomInt(min, max));
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
