import { app, request, createUser, authHeader } from "../helpers";
import { Category } from "../../src/models/Category";
import { Product } from "../../src/models/Product";
import { Order } from "../../src/models/Order";
import { Payment } from "../../src/models/Payment";
import { env } from "../../src/config/env";
import * as emailService from "../../src/integrations/email/email.service";
import * as paymentService from "../../src/services/payment.service";
import { notifyOwnerNewOrder } from "../../src/services/orderNotification.service";

async function createProduct(sellerId: string) {
  const category = await Category.create({
    name: "Electronics",
    slug: `electronics-${Date.now()}-${Math.random()}`,
    isActive: true,
  });
  return Product.create({
    name: "Wireless Mouse",
    slug: `mouse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: "Ergonomic wireless mouse with silent clicks and 18-month battery life.",
    shortDescription: "Wireless mouse",
    sku: `SKU-NTF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    price: 50,
    currency: "GNF",
    images: ["https://example.com/mouse.jpg"],
    category: category._id,
    seller: sellerId,
    availableStock: 5,
    status: "published",
  });
}

function checkoutPayload(productId: string, overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

function mockEmailSuccess() {
  return jest
    .spyOn(emailService, "sendEmail")
    .mockResolvedValue({ provider: "console", messageId: "test_msg", status: "sent" });
}

describe("Owner new-order email notification", () => {
  const originalOwnerEmail = env.OWNER_NOTIFICATION_EMAIL;

  afterEach(() => {
    env.OWNER_NOTIFICATION_EMAIL = originalOwnerEmail;
  });

  it("sends the notification once a cash-on-delivery order is successfully created", async () => {
    const sendEmailSpy = mockEmailSuccess();
    const seller = await createUser("seller");
    const customer = await createUser("customer", { email: "notif-success@lumera.test" });
    const product = await createProduct(String(seller.user._id));

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id)));

    expect(res.status).toBe(201);
    // A manual-method order also triggers the customer confirmation email (see
    // customerOrderConfirmation.test.ts) — this test only asserts the owner side.
    expect(sendEmailSpy).toHaveBeenCalledTimes(2);
    const call = sendEmailSpy.mock.calls.find((c) => c[0].to === env.OWNER_NOTIFICATION_EMAIL)![0];
    expect(call.subject).toContain(res.body.orderNumber);
    expect(call.html).toContain(res.body.orderNumber);
    expect(call.text).toContain(res.body.orderNumber);

    const order = await Order.findById(res.body.id);
    expect(order!.ownerNotifiedAt).toBeTruthy();
  });

  it("does not send a notification when order creation fails (insufficient stock)", async () => {
    const sendEmailSpy = mockEmailSuccess();
    const seller = await createUser("seller");
    const customer = await createUser("customer", { email: "notif-fail-stock@lumera.test" });
    const product = await createProduct(String(seller.user._id));
    await Product.findByIdAndUpdate(product._id, { availableStock: 1 });

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(
        checkoutPayload(String(product._id), {
          items: [{ productId: String(product._id), quantity: 5 }],
        }),
      );

    expect(res.status).toBe(400);
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  it("does not send a notification when an online payment is refused via webhook", async () => {
    const sendEmailSpy = mockEmailSuccess();
    const seller = await createUser("seller");
    const customer = await createUser("customer", { email: "notif-refused@lumera.test" });
    const product = await createProduct(String(seller.user._id));

    // "card" is a gateway (non-manual) method: no notification fires at creation time —
    // it only would on payment capture. We simulate the gateway rejecting the payment.
    const orderRes = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id), { paymentMethod: "card" }));
    expect(orderRes.status).toBe(201);
    expect(sendEmailSpy).not.toHaveBeenCalled();

    const payment = await Payment.create({
      order: orderRes.body.id,
      provider: "gateway",
      transactionId: `gw_test_${Date.now()}`,
      amount: orderRes.body.total,
      currency: "GNF",
      method: "card",
      idempotencyKey: `order:${orderRes.body.id}:test`,
    });

    await paymentService.applyWebhookEvent("gateway", {
      eventId: "evt_refused_1",
      transactionId: payment.transactionId,
      status: "failed",
      amount: payment.amount,
      currency: payment.currency,
      raw: {},
    });

    const order = await Order.findById(orderRes.body.id);
    expect(order!.status).toBe("cancelled");
    expect(order!.ownerNotifiedAt).toBeFalsy();
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  it("never sends a duplicate notification for the same order (refresh/retry/repeated webhook)", async () => {
    const sendEmailSpy = mockEmailSuccess();
    const seller = await createUser("seller");
    const customer = await createUser("customer", { email: "notif-dup@lumera.test" });
    const product = await createProduct(String(seller.user._id));

    const orderRes = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id)));
    expect(sendEmailSpy).toHaveBeenCalledTimes(2); // owner + customer confirmation

    // Simulate a retry / re-entrant call for the very same order (e.g. a repeated
    // webhook, or another code path re-invoking the notifier for an already-notified order).
    const order = await Order.findById(orderRes.body.id);
    await notifyOwnerNewOrder(order!);
    await notifyOwnerNewOrder(order!);

    expect(sendEmailSpy).toHaveBeenCalledTimes(2);
  });

  it("does not fail order creation when the email service is unavailable", async () => {
    jest.spyOn(emailService, "sendEmail").mockRejectedValue(new Error("SMTP connection refused"));
    const seller = await createUser("seller");
    const customer = await createUser("customer", { email: "notif-smtp-down@lumera.test" });
    const product = await createProduct(String(seller.user._id));

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id)));

    expect(res.status).toBe(201);
    const order = await Order.findById(res.body.id);
    expect(order).not.toBeNull();
    expect(order!.status).toBe("pending");
  });

  it("skips sending and logs a warning when OWNER_NOTIFICATION_EMAIL is not configured", async () => {
    const sendEmailSpy = mockEmailSuccess();
    env.OWNER_NOTIFICATION_EMAIL = "";

    const seller = await createUser("seller");
    const customer = await createUser("customer", { email: "notif-unconfigured@lumera.test" });
    const product = await createProduct(String(seller.user._id));

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id)));

    expect(res.status).toBe(201);
    // Owner email is skipped (unconfigured), but the customer still gets their confirmation —
    // that email doesn't depend on OWNER_NOTIFICATION_EMAIL.
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy.mock.calls[0][0].to).toBe("notif-unconfigured@lumera.test");

    const order = await Order.findById(res.body.id);
    expect(order!.ownerNotifiedAt).toBeFalsy();
  });
});
