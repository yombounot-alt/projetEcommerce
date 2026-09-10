import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
} from "../validators/category.validator";
import { idParam, slugParam } from "../validators/common.validator";

const router = Router();

router.get("/", optionalAuthenticate, categoryController.list);
router.get("/slug/:slug", validate({ params: slugParam }), categoryController.getBySlug);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate({ body: createCategorySchema }),
  categoryController.create,
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validate({ params: idParam, body: updateCategorySchema }),
  categoryController.update,
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validate({ params: idParam }),
  categoryController.remove,
);

router.get("/brands", categoryController.listBrands);
router.get(
  "/brands/slug/:slug",
  validate({ params: slugParam }),
  categoryController.getBrandBySlug,
);
router.post(
  "/brands",
  authenticate,
  authorize("admin"),
  validate({ body: createBrandSchema }),
  categoryController.createBrand,
);
router.delete(
  "/brands/:id",
  authenticate,
  authorize("admin"),
  validate({ params: idParam }),
  categoryController.removeBrand,
);

export default router;
