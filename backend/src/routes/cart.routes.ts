import { Router } from "express";
import * as cartController from "../controllers/cart.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
  cartItemQuerySchema,
} from "../validators/cart.validator";

const router = Router();

router.use(authenticate, authorize("customer"));

router.get("/", cartController.getCart);
router.post("/items", validate({ body: addCartItemSchema }), cartController.addItem);
router.patch(
  "/items/:productId",
  validate({ params: cartItemParamsSchema, body: updateCartItemSchema }),
  cartController.updateItem,
);
router.delete(
  "/items/:productId",
  validate({ params: cartItemParamsSchema, query: cartItemQuerySchema }),
  cartController.removeItem,
);
router.delete("/", cartController.clear);

export default router;
