import { app, request, createUser, authHeader } from "../helpers";
import { Category } from "../../src/models/Category";
import { Product } from "../../src/models/Product";
import { Payment } from "../../src/models/Payment";
import { Order } from "../../src/models/Order";
import * as paymentService from "../../src/services/payment.service";

async function createProduct(sellerId: string) {
  const category = await Category.create({
    name: "Electronics",
    slug: `electronics-${Date.now()}-${Math.random()}`,
    isActive: true,
  });
  return Product.create({
    name: "Action Camera",
    slug: `camera-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: "Waterproof action camera with 4K recording and stabilization.",
    shortDescription: "Action camera",
    sku: `SKU-PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    price: 300,
    currency: "GNF",
    images: ["https://example.com/camera.jpg"],
    category: category._id,
    seller: sellerId,
    availableStock: 5,
    status: "published",
  });
}

async function createPendingOrder(customerToken: string, productId: string) {
  return request(app)
    .post("/api/v1/orders")
    .set(authHeader(customerToken))
    .send({
      items: [{ productId, quantity: 1 }],
      shippingAddress: {
        fullName: "Test Customer",
        line1: "1 Main Street",
        city: "Conakry",
        postalCode: "00224",
        country: "Guinea",
        phone: "+224600000099",
      },
      shippingMethod: "standard",
      paymentMethod: "cash_on_delivery",
    });
}

describe("Payments", () => {
  it("initializes a cash_on_delivery payment and leaves it pending", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id));

    const orderRes = await createPendingOrder(customer.accessToken, String(product._id));

    const res = await request(app)
      .post("/api/v1/payments/initialize")
      .set(authHeader(customer.accessToken))
      .send({ orderId: orderRes.body.id, method: "cash_on_delivery" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.provider).toBe("manual");
  });

  it("rejects payment initialization from a non-owning customer", async () => {
    const seller = await createUser("seller");
    const customerA = await createUser("customer", { email: "payA@lumera.test" });
    const customerB = await createUser("customer", { email: "payB@lumera.test" });
    const product = await createProduct(String(seller.user._id));

    const orderRes = await createPendingOrder(customerA.accessToken, String(product._id));

    const res = await request(app)
      .post("/api/v1/payments/initialize")
      .set(authHeader(customerB.accessToken))
      .send({ orderId: orderRes.body.id, method: "cash_on_delivery" });

    expect(res.status).toBe(403);
  });

  it("returns 503 for an unconfigured gateway method (paypal) without leaving stock reserved indefinitely", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id));

    const orderRes = await createPendingOrder(customer.accessToken, String(product._id));

    // "card"/"mobile_money" are handled by ChapchaPay (see payment.service.ts) — "paypal"
    // is the method still left on the unconfigured gateway placeholder.
    const res = await request(app)
      .post("/api/v1/payments/initialize")
      .set(authHeader(customer.accessToken))
      .send({ orderId: orderRes.body.id, method: "paypal" });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe("PAYMENT_METHOD_UNAVAILABLE");
  });

  describe("Webhook idempotency", () => {
    it("applies a captured webhook event exactly once even if delivered twice", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id));

      const orderRes = await createPendingOrder(customer.accessToken, String(product._id));
      await request(app)
        .post("/api/v1/payments/initialize")
        .set(authHeader(customer.accessToken))
        .send({ orderId: orderRes.body.id, method: "cash_on_delivery" });

      const payment = await Payment.findOne({ order: orderRes.body.id });
      expect(payment).not.toBeNull();

      const event = {
        eventId: "evt_test_1",
        transactionId: payment!.transactionId,
        status: "captured" as const,
        amount: payment!.amount,
        currency: payment!.currency,
        raw: {},
      };

      await paymentService.applyWebhookEvent("manual", event);
      await paymentService.applyWebhookEvent("manual", event); // delivered twice — must be a no-op the 2nd time

      const order = await Order.findById(orderRes.body.id);
      expect(order!.status).toBe("paid");

      const updatedProduct = await Product.findById(product._id);
      // soldStock must have been incremented exactly once, not twice
      expect(updatedProduct!.soldStock).toBe(1);
      expect(updatedProduct!.reservedStock).toBe(0);
    });

    it("cancels the order and releases stock on a failed payment webhook", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id));

      const orderRes = await createPendingOrder(customer.accessToken, String(product._id));
      await request(app)
        .post("/api/v1/payments/initialize")
        .set(authHeader(customer.accessToken))
        .send({ orderId: orderRes.body.id, method: "cash_on_delivery" });

      const payment = await Payment.findOne({ order: orderRes.body.id });

      await paymentService.applyWebhookEvent("manual", {
        eventId: "evt_test_fail",
        transactionId: payment!.transactionId,
        status: "failed",
        amount: payment!.amount,
        currency: payment!.currency,
        raw: {},
      });

      const order = await Order.findById(orderRes.body.id);
      expect(order!.status).toBe("cancelled");

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct!.availableStock).toBe(5);
      expect(updatedProduct!.reservedStock).toBe(0);
    });
  });

  describe("Refunds", () => {
    it("only allows an admin to issue a refund", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id));

      const orderRes = await createPendingOrder(customer.accessToken, String(product._id));
      await request(app)
        .post("/api/v1/payments/initialize")
        .set(authHeader(customer.accessToken))
        .send({ orderId: orderRes.body.id, method: "cash_on_delivery" });

      const payment = await Payment.findOne({ order: orderRes.body.id });

      const forbiddenRes = await request(app)
        .post(`/api/v1/payments/${payment!.id}/refund`)
        .set(authHeader(customer.accessToken))
        .send({});
      expect(forbiddenRes.status).toBe(403);
    });
  });

  describe("Manual reconciliation", () => {
    // A "card" payment stuck in "pending" (as if ChapchaPay never delivered a webhook) is
    // created directly rather than via /payments/initialize, to avoid a real HTTP call to
    // ChapchaPay from the test suite.
    async function createStuckGatewayPayment(customerToken: string, sellerId: string) {
      const product = await createProduct(sellerId);
      const orderRes = await createPendingOrder(customerToken, String(product._id));
      const payment = await Payment.create({
        order: orderRes.body.id,
        provider: "chapchapay",
        transactionId: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        amount: orderRes.body.total,
        currency: "GNF",
        status: "pending",
        method: "card",
        idempotencyKey: `test-key-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      return { orderRes, payment, product };
    }

    it("lets an admin reconcile a stuck pending payment to captured", async () => {
      const seller = await createUser("seller");
      const admin = await createUser("admin");
      const customer = await createUser("customer");
      const { orderRes, payment, product } = await createStuckGatewayPayment(
        customer.accessToken,
        String(seller.user._id),
      );

      const res = await request(app)
        .post(`/api/v1/payments/${payment.id}/reconcile`)
        .set(authHeader(admin.accessToken))
        .send({ status: "captured" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("captured");

      const order = await Order.findById(orderRes.body.id);
      expect(order!.status).toBe("paid");

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct!.soldStock).toBe(1);
      expect(updatedProduct!.reservedStock).toBe(0);
    });

    it("lets an admin reconcile a stuck pending payment to failed and releases stock", async () => {
      const seller = await createUser("seller");
      const admin = await createUser("admin");
      const customer = await createUser("customer");
      const { orderRes, payment, product } = await createStuckGatewayPayment(
        customer.accessToken,
        String(seller.user._id),
      );

      const res = await request(app)
        .post(`/api/v1/payments/${payment.id}/reconcile`)
        .set(authHeader(admin.accessToken))
        .send({ status: "failed", reason: "Confirmé refusé dans le dashboard ChapchaPay" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("failed");

      const order = await Order.findById(orderRes.body.id);
      expect(order!.status).toBe("cancelled");

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct!.availableStock).toBe(5);
      expect(updatedProduct!.reservedStock).toBe(0);
    });

    it("rejects reconciliation from a non-admin", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const { payment } = await createStuckGatewayPayment(
        customer.accessToken,
        String(seller.user._id),
      );

      const res = await request(app)
        .post(`/api/v1/payments/${payment.id}/reconcile`)
        .set(authHeader(customer.accessToken))
        .send({ status: "captured" });

      expect(res.status).toBe(403);
    });

    it("rejects reconciliation of a payment that is no longer pending", async () => {
      const seller = await createUser("seller");
      const admin = await createUser("admin");
      const customer = await createUser("customer");
      const { payment } = await createStuckGatewayPayment(
        customer.accessToken,
        String(seller.user._id),
      );

      await request(app)
        .post(`/api/v1/payments/${payment.id}/reconcile`)
        .set(authHeader(admin.accessToken))
        .send({ status: "captured" });

      const secondAttempt = await request(app)
        .post(`/api/v1/payments/${payment.id}/reconcile`)
        .set(authHeader(admin.accessToken))
        .send({ status: "failed" });

      expect(secondAttempt.status).toBe(409);
    });
  });

  describe("Pending payment expiry", () => {
    it("expires a stale pending gateway payment, cancels the order, and releases stock", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id));
      const orderRes = await createPendingOrder(customer.accessToken, String(product._id));

      const staleDate = new Date(Date.now() - 25 * 60 * 60_000); // older than the 24h default
      await Payment.create({
        order: orderRes.body.id,
        provider: "chapchapay",
        transactionId: `test_expire_${Date.now()}`,
        amount: orderRes.body.total,
        currency: "GNF",
        status: "pending",
        method: "card",
        idempotencyKey: `test-expire-key-${Date.now()}`,
        createdAt: staleDate,
      });

      const expiredCount = await paymentService.expirePendingPayments();
      expect(expiredCount).toBeGreaterThanOrEqual(1);

      const order = await Order.findById(orderRes.body.id);
      expect(order!.status).toBe("cancelled");

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct!.availableStock).toBe(5);
      expect(updatedProduct!.reservedStock).toBe(0);
    });

    it("never expires manual-method payments (cash_on_delivery), even if very old", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id));
      const orderRes = await createPendingOrder(customer.accessToken, String(product._id));

      const staleDate = new Date(Date.now() - 24 * 60 * 60_000); // 24h old
      await Payment.create({
        order: orderRes.body.id,
        provider: "manual",
        transactionId: `test_manual_${Date.now()}`,
        amount: orderRes.body.total,
        currency: "GNF",
        status: "pending",
        method: "cash_on_delivery",
        idempotencyKey: `test-manual-key-${Date.now()}`,
        createdAt: staleDate,
      });

      await paymentService.expirePendingPayments();

      const order = await Order.findById(orderRes.body.id);
      expect(order!.status).toBe("pending");
    });
  });
});
