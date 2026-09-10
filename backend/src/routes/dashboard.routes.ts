import { Router } from "express";
import * as statisticsController from "../controllers/statistics.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.get(
  "/overview",
  authenticate,
  authorize("admin", "seller"),
  statisticsController.getDashboardOverview,
);

export default router;
