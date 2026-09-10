import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { applyCouponSchema } from "../validators/order.validator";
import * as orderController from "../controllers/order.controller";

const router = Router();

router.post(
  "/apply",
  authenticate,
  validate({ body: applyCouponSchema }),
  orderController.applyCoupon,
);

export default router;
