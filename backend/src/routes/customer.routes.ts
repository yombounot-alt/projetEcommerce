import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { catchAsync } from "../utils/catchAsync";
import * as orderService from "../services/order.service";
import { ForbiddenError } from "../utils/AppError";
import { objectId } from "../validators/common.validator";

const router = Router();
const customerIdParam = z.object({ customerId: objectId });

router.get(
  "/:customerId/orders",
  authenticate,
  validate({ params: customerIdParam }),
  catchAsync(async (req, res) => {
    if (req.user!.role !== "admin" && req.user!.id !== req.params.customerId) {
      throw new ForbiddenError(
        "Vous ne pouvez consulter que vos propres commandes",
        "CUSTOMER_ACCESS_DENIED",
      );
    }
    const orders = await orderService.listOrdersByCustomer(req.params.customerId);
    res.status(200).json(orders);
  }),
);

export default router;
