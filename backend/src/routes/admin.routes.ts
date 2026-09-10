import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { catchAsync } from "../utils/catchAsync";
import * as statisticsController from "../controllers/statistics.controller";
import * as userController from "../controllers/user.controller";
import * as orderController from "../controllers/order.controller";
import * as productController from "../controllers/product.controller";
import * as settingsController from "../controllers/settings.controller";
import { AuditLog } from "../models/AuditLog";
import { normalizePagination, buildPaginatedResult } from "../utils/pagination";
import { paginationQuery } from "../validators/common.validator";
import { updateSettingsSchema } from "../validators/settings.validator";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/statistics", statisticsController.getAdminStatistics);
router.get("/users", userController.list);
router.get("/orders", orderController.list);
router.get("/products", productController.list);

router.get("/settings", settingsController.get);
router.patch("/settings", validate({ body: updateSettingsSchema }), settingsController.update);

router.get(
  "/audit-logs",
  validate({ query: paginationQuery }),
  catchAsync(async (req, res) => {
    const { page, pageSize, skip } = normalizePagination(
      (req.query as { page?: string }).page,
      (req.query as { pageSize?: string }).pageSize,
    );
    const [items, totalItems] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("actor", "firstName lastName email"),
      AuditLog.countDocuments(),
    ]);
    res.status(200).json(buildPaginatedResult(items, totalItems, page, pageSize));
  }),
);

export default router;
