import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().default("/api/v1"),
  FRONTEND_URL: z.string().url(),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_TEST_URI: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  COOKIE_SECRET: z.string().min(16, "COOKIE_SECRET must be at least 16 characters"),

  // === Paiement ChapchaPay (voir src/integrations/payment/providers/chapchapay.provider.ts) ===
  CHAPCHAPAY_BASE_URL: z.string().url().default("https://chapchappay.com/api"),
  CHAPCHAPAY_API_KEY: z.string().optional().default(""),
  CHAPCHAPAY_HMAC_SECRET: z.string().optional().default(""),
  // URL publique de CE backend (utilisée pour construire notify_url envoyé à ChapchaPay).
  BACKEND_PUBLIC_URL: z.string().url().default("http://localhost:5000"),
  // Filet de sécurité : au-delà de ce délai, un paiement gateway (ChapchaPay...) resté
  // "pending" sans webhook est considéré expiré (stock relâché) — voir paymentExpiry.service.ts.
  // Ne s'applique pas aux méthodes manuelles (cash_on_delivery/bank_transfer).
  // Défaut temporairement à 24h (1440) tant que la fiabilité des webhooks ChapchaPay n'est
  // pas confirmée — redescendre vers 30-60 min une fois la livraison webhook fiabilisée.
  PAYMENT_PENDING_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(1440),

  SMS_API_URL: z.string().optional().default(""),
  SMS_API_KEY: z.string().optional().default(""),
  SMS_SENDER: z.string().optional().default("Lumera"),

  // === Email (générique — voir src/integrations/email) ===
  // API HTTP (Resend) — préférée dès qu'elle est configurée : envoie sur le port 443, donc
  // fonctionne même sur un hébergeur qui bloque le SMTP sortant (confirmé sur Railway,
  // voir smtp.provider.ts). SMTP reste disponible en repli pour qui a un relais non bloqué.
  RESEND_API_KEY: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  SMTP_SECURE: z.coerce.boolean().optional().default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  EMAIL_FROM_ADDRESS: z.string().optional().default(""),
  EMAIL_FROM_NAME: z.string().optional().default("Lumera"),
  OWNER_NOTIFICATION_EMAIL: z
    .string()
    .optional()
    .default("")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "OWNER_NOTIFICATION_EMAIL must be a valid email address",
    }),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    // Fail fast: an application with missing/invalid critical env vars must never start silently.
    console.error(
      `\n[ENV VALIDATION ERROR] Invalid or missing environment variables:\n${formatted}\n`,
    );
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const isDevelopment = env.NODE_ENV === "development";
