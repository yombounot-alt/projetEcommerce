import { Router } from "express";
import { z } from "zod";
import * as reviewController from "../controllers/review.controller";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { updateReviewSchema } from "../validators/review.validator";

const router = Router();
const reviewIdParam = z.object({ reviewId: z.string().min(1) });

router.patch(
  "/:reviewId",
  authenticate,
  validate({ params: reviewIdParam, body: updateReviewSchema }),
  reviewController.update,
);
router.delete(
  "/:reviewId",
  authenticate,
  validate({ params: reviewIdParam }),
  reviewController.remove,
);

export default router;
