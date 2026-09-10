import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

const DB_STATE_LABELS: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
  99: "uninitialized",
};

router.get("/", (_req, res) => {
  const dbState = DB_STATE_LABELS[mongoose.connection.readyState] ?? "unknown";

  res.status(200).json({
    success: true,
    message: "API is running",
    database: dbState,
    timestamp: new Date().toISOString(),
  });
});

export default router;
