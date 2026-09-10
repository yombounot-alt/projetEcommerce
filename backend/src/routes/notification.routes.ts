import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { idParam } from "../validators/common.validator";

const router = Router();

router.use(authenticate);

router.get("/", notificationController.list);
router.patch("/:id/read", validate({ params: idParam }), notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

export default router;
