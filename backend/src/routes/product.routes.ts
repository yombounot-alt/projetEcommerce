import { Router } from "express";
import { z } from "zod";
import * as productController from "../controllers/product.controller";
import * as reviewController from "../controllers/review.controller";
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
} from "../validators/product.validator";
import { createReviewSchema } from "../validators/review.validator";
import { objectId, idParam } from "../validators/common.validator";

const router = Router();
const productIdParam = z.object({ productId: objectId });

router.get("/featured", productController.getFeatured);
router.get("/new", productController.getNewArrivals);
router.get("/slug/:slug", productController.getBySlug);
router.get("/:id/related", validate({ params: idParam }), productController.getRelated);

router.get(
  "/:productId/reviews",
  validate({ params: productIdParam }),
  reviewController.listForProduct,
);
router.post(
  "/:productId/reviews",
  authenticate,
  authorize("customer"),
  validate({ params: productIdParam, body: createReviewSchema }),
  reviewController.create,
);

/**
 * @openapi
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List published products with search, filters, sort and pagination
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category slug
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [relevance, popularity, price_asc, price_desc, newest] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated product list
 *   post:
 *     tags: [Products]
 *     summary: Create a product (seller or admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 */
router.get(
  "/",
  optionalAuthenticate,
  validate({ query: productListQuerySchema }),
  productController.list,
);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Product' }
 *       404: { description: Not found }
 */
router.get("/:id", validate({ params: idParam }), productController.getById);

router.post(
  "/",
  authenticate,
  authorize("seller", "admin"),
  validate({ body: createProductSchema }),
  productController.create,
);
router.patch(
  "/:id",
  authenticate,
  authorize("seller", "admin"),
  validate({ params: idParam, body: updateProductSchema }),
  productController.update,
);
router.delete(
  "/:id",
  authenticate,
  authorize("seller", "admin"),
  validate({ params: idParam }),
  productController.remove,
);

export default router;
