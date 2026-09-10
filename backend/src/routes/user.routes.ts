import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  userListQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "../validators/user.validator";
import { idParam } from "../validators/common.validator";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", validate({ query: userListQuerySchema }), userController.list);
router.get("/:id", validate({ params: idParam }), userController.getById);
router.patch(
  "/:id/role",
  validate({ params: idParam, body: updateUserRoleSchema }),
  userController.updateRole,
);
router.patch(
  "/:id/status",
  validate({ params: idParam, body: updateUserStatusSchema }),
  userController.updateStatus,
);

export default router;
