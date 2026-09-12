import type { Server } from "http";
import { createApp } from "./app";
import { env, isTest } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { logger } from "./utils/logger";
import { expirePendingPayments } from "./services/payment.service";

let server: Server | undefined;
let paymentExpiryTimer: NodeJS.Timeout | undefined;

const PAYMENT_EXPIRY_CHECK_INTERVAL_MS = 5 * 60_000;

async function start(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  server = app.listen(env.PORT, () => {
    logger.info(`Luméra API listening on port ${env.PORT} (${env.NODE_ENV}) — docs at /api/docs`);
  });

  // Safety net for gateway payments stuck "pending" with no confirming webhook — see
  // payment.service.ts#expirePendingPayments. Disabled in tests (each test file manages its
  // own isolated DB/timing and doesn't want a background timer running).
  if (!isTest) {
    paymentExpiryTimer = setInterval(() => {
      expirePendingPayments().catch((error) => {
        logger.error("Payment expiry sweep failed", { error });
      });
    }, PAYMENT_EXPIRY_CHECK_INTERVAL_MS);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);

  try {
    if (paymentExpiryTimer) {
      clearInterval(paymentExpiryTimer);
    }
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
    }
    await disconnectDatabase();
    clearTimeout(forceExitTimer);
    logger.info("Shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", { error });
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message, stack: error.stack });
  process.exit(1);
});

start().catch((error) => {
  logger.error("Failed to start server", { error });
  process.exit(1);
});
