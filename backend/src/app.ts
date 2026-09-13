import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { env, isProduction, isTest } from "./config/env";
import { installFrenchZodErrorMap } from "./config/zodErrorMap";
import { swaggerSpec } from "./docs/swagger";
import apiRoutes from "./routes";
import healthRoutes from "./routes/health.routes";
import sitemapRoutes from "./routes/sitemap.routes";
import paymentRoutes from "./routes/payment.routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { globalLimiter } from "./middlewares/rateLimiters";
import { logger } from "./utils/logger";

export function createApp(): Express {
  installFrenchZodErrorMap();

  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  );

  if (!isTest) {
    app.use(
      morgan(isProduction ? "combined" : "dev", {
        stream: { write: (msg) => logger.info(msg.trim()) },
      }),
    );
  }

  app.use(globalLimiter);

  const webhookPath = `${env.API_PREFIX}/payments/webhook`;
  const jsonParser = express.json({ limit: "1mb" });
  const urlencodedParser = express.urlencoded({ extended: true, limit: "1mb" });

  // Payment webhooks need the untouched raw request body to verify provider signatures.
  // The request stream can only be consumed once, so json/urlencoded parsing must be
  // skipped entirely for this path — express.raw() is what reads the stream instead.
  app.use(webhookPath, express.raw({ type: "*/*", limit: "1mb" }));
  app.use((req, res, next) => {
    if (req.path.startsWith(webhookPath)) return next();
    jsonParser(req, res, (err) => {
      if (err) return next(err);
      urlencodedParser(req, res, next);
    });
  });

  app.use(cookieParser(env.COOKIE_SECRET));

  // mongoSanitize/hpp operate on parsed body/query objects — skip them for the raw-body
  // webhook path, where req.body is intentionally still a Buffer.
  app.use((req, res, next) => {
    if (req.path.startsWith(webhookPath)) return next();
    mongoSanitize()(req, res, (err) => {
      if (err) return next(err);
      hpp()(req, res, next);
    });
  });

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use("/api/health", healthRoutes);
  app.use(sitemapRoutes);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // payments/webhook must not go through the json-parsing api router since it needs the raw body.
  app.use(`${env.API_PREFIX}/payments`, paymentRoutes);
  app.use(env.API_PREFIX, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
