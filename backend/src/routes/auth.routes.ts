import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { authLimiter } from "../middlewares/rateLimiters";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  updateProfileSchema,
  addAddressSchema,
  updateAddressSchema,
} from "../validators/auth.validator";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string, format: password }
 *     responses:
 *       201:
 *         description: Account created — returns the user, access token and expiry (refresh token is set as an httpOnly cookie)
 *       409:
 *         description: Email already registered
 */
router.post("/register", authLimiter, validate({ body: registerSchema }), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Session created
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authLimiter, validate({ body: loginSchema }), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the refresh token cookie and issue a new access token
 *     responses:
 *       200: { description: New session issued }
 *       401: { description: Refresh token missing, invalid, expired or revoked }
 */
router.post("/refresh", authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh token and clear the session cookie
 *     responses:
 *       204: { description: Logged out }
 */
router.post("/logout", authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user's profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { description: Not authenticated }
 */
router.get("/me", authenticate, authController.me);
router.patch(
  "/profile",
  authenticate,
  validate({ body: updateProfileSchema }),
  authController.updateProfile,
);
router.patch(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);

router.post(
  "/forgot-password",
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);
router.post("/verify-email/request", authenticate, authController.requestEmailVerification);
router.post("/verify-email", validate({ body: verifyEmailSchema }), authController.verifyEmail);

router.get("/addresses", authenticate, authController.listAddresses);
router.post(
  "/addresses",
  authenticate,
  validate({ body: addAddressSchema }),
  authController.addAddress,
);
router.patch(
  "/addresses/:addressId",
  authenticate,
  validate({ body: updateAddressSchema }),
  authController.updateAddress,
);
router.delete("/addresses/:addressId", authenticate, authController.deleteAddress);

export default router;
