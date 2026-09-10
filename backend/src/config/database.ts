import mongoose from "mongoose";
import { env, isTest } from "./env";
import { logger } from "../utils/logger";

mongoose.set("strictQuery", true);

export async function connectDatabase(): Promise<void> {
  const uri = isTest ? env.MONGODB_TEST_URI || env.MONGODB_URI : env.MONGODB_URI;

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected");
  });

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", { error: error.message });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
