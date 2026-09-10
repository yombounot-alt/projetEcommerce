import { Router } from "express";
import { z } from "zod";
import * as orderController from "../controllers/order.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderListQuerySchema,
} from "../validators/order.validator";
import { idParam } from "../validators/common.validator";

const router = Router();
const orderNumberParam = z.object({ orderNumber: z.string().min(1) });

router.use(authenticate);

router.get(
  "/",
  authorize("admin", "seller"),
  validate({ query: orderListQuerySchema }),
  orderController.list,
);
router.get("/mine", authorize("customer"), orderController.listMine);
router.get(
  "/number/:orderNumber",
  validate({ params: orderNumberParam }),
  orderController.getByNumber,
);
router.get("/:id", validate({ params: idParam }), orderController.getById);

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create an order from server-validated cart items (checkout)
 *     description: >
 *       Prices, stock and totals are always recomputed from MongoDB — client-supplied
 *       amounts are never trusted. Stock is reserved atomically inside a transaction.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, shippingAddress, shippingMethod, paymentMethod]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: integer }
 *               shippingMethod: { type: string, enum: [standard, express] }
 *               paymentMethod: { type: string, enum: [card, paypal, bank_transfer, cash_on_delivery, mobile_money] }
 *               couponCode: { type: string }
 *     responses:
 *       201:
 *         description: Order created (status "pending" — call POST /payments/initialize next)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 *       400: { description: Insufficient stock or invalid coupon }
 */
router.post(
  "/",
  authorize("customer"),
  validate({ body: createOrderSchema }),
  orderController.create,
);
router.patch(
  "/:id/status",
  validate({ params: idParam, body: updateOrderStatusSchema }),
  orderController.updateStatus,
);

export default router;
