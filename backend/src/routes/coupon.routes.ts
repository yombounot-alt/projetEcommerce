import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  applyCouponSchema,
  createCouponSchema,
  updateCouponSchema,
} from "../validators/coupon.validator";
import { idParam, paginationQuery } from "../validators/common.validator";
import * as couponController from "../controllers/coupon.controller";

const router = Router();

router.post(
  "/apply",
  authenticate,
  validate({ body: applyCouponSchema }),
  couponController.preview,
);

router.use(authenticate, authorize("admin"));

router.get("/", validate({ query: paginationQuery }), couponController.list);
router.post("/", validate({ body: createCouponSchema }), couponController.create);
router.patch(
  "/:id",
  validate({ params: idParam, body: updateCouponSchema }),
  couponController.update,
);
router.delete("/:id", validate({ params: idParam }), couponController.remove);

export default router;
