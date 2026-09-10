import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import productRoutes from "./product.routes";
import categoryRoutes from "./category.routes";
import cartRoutes from "./cart.routes";
import wishlistRoutes from "./wishlist.routes";
import orderRoutes from "./order.routes";
import customerRoutes from "./customer.routes";
import couponRoutes from "./coupon.routes";
import notificationRoutes from "./notification.routes";
import reviewRoutes from "./review.routes";
import adminRoutes from "./admin.routes";
import sellerRoutes from "./seller.routes";
import uploadRoutes from "./upload.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/customers", customerRoutes);
router.use("/coupons", couponRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);
router.use("/seller", sellerRoutes);
router.use("/uploads", uploadRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
