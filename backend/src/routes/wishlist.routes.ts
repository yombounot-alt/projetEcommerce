import { Router } from "express";
import { z } from "zod";
import * as wishlistController from "../controllers/wishlist.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { objectId } from "../validators/common.validator";

const router = Router();
const productIdParam = z.object({ productId: objectId });

router.use(authenticate, authorize("customer"));

router.get("/", wishlistController.getWishlist);
router.post("/:productId", validate({ params: productIdParam }), wishlistController.addItem);
router.delete("/:productId", validate({ params: productIdParam }), wishlistController.removeItem);

export default router;
