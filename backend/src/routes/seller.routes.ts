import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as statisticsController from "../controllers/statistics.controller";
import * as orderController from "../controllers/order.controller";
import * as productController from "../controllers/product.controller";
import * as userController from "../controllers/user.controller";
import { userListQuerySchema } from "../validators/user.validator";

const router = Router();

router.use(authenticate, authorize("seller"));

router.get("/statistics", statisticsController.getSellerStatistics);
router.get("/orders", orderController.list);
router.get(
  "/customers",
  validate({ query: userListQuerySchema }),
  userController.listSellerCustomers,
);

// A seller only ever sees their own catalogue — the seller filter is forced server-side
// so it can never be overridden by a query param (marketplace isolation, rule 26).
router.get(
  "/products",
  (req, _res, next) => {
    req.query.seller = req.user!.id;
    next();
  },
  productController.list,
);

export default router;
