import { app, request, createUser, authHeader } from "../helpers";
import { Category } from "../../src/models/Category";
import { Product } from "../../src/models/Product";
import { Order } from "../../src/models/Order";
import { Payment } from "../../src/models/Payment";
import * as emailService from "../../src/integrations/email/email.service";
import * as paymentService from "../../src/services/payment.service";
import { notifyCustomerOrderConfirmed } from "../../src/services/orderNotification.service";

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
    sku: `SKU-CNF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

describe("Customer order confirmation email", () => {
  it("sends a confirmation to the customer once a cash-on-delivery order is created", async () => {
    const sendEmailSpy = mockEmailSuccess();
    const seller = await createUser("seller");
    const customerEmail = "confirm-cod@lumera.test";
    const customer = await createUser("customer", { email: customerEmail });
    const product = await createProduct(String(seller.user._id));

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id)));

    expect(res.status).toBe(201);
    const call = sendEmailSpy.mock.calls.find((c) => c[0].to === customerEmail)![0];
    expect(call.subject).toContain(res.body.orderNumber);
    expect(call.html).toContain(res.body.orderNumber);
    expect(call.text).toContain(res.body.orderNumber);

    const order = await Order.findById(res.body.id);
    expect(order!.customerConfirmationSentAt).toBeTruthy();
  });

  it("does not send a confirmation when a gateway payment is only initialized, not captured", async () => {
    const sendEmailSpy = mockEmailSuccess();
    const seller = await createUser("seller");
    const customerEmail = "confirm-pending@lumera.test";
    const customer = await createUser("customer", { email: customerEmail });
    const product = await createProduct(String(seller.user._id));

    const orderRes = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id), { paymentMethod: "card" }));

    expect(orderRes.status).toBe(201);
    expect(sendEmailSpy.mock.calls.some((c) => c[0].to === customerEmail)).toBe(false);
  });

  it("sends a confirmation once a gateway payment is captured via webhook", async () => {
    const sendEmailSpy = mockEmailSuccess();
    const seller = await createUser("seller");
    const customerEmail = "confirm-captured@lumera.test";
    const customer = await createUser("customer", { email: customerEmail });
    const product = await createProduct(String(seller.user._id));

    const orderRes = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id), { paymentMethod: "card" }));

    const payment = await Payment.create({
      order: orderRes.body.id,
      provider: "gateway",
      transactionId: `gw_confirm_${Date.now()}`,
      amount: orderRes.body.total,
      currency: "GNF",
      method: "card",
      idempotencyKey: `order:${orderRes.body.id}:confirm-test`,
    });

    await paymentService.applyWebhookEvent("gateway", {
      eventId: "evt_captured_1",
      transactionId: payment.transactionId,
      status: "captured",
      amount: payment.amount,
      currency: payment.currency,
      raw: {},
    });

    const call = sendEmailSpy.mock.calls.find((c) => c[0].to === customerEmail)![0];
    expect(call.subject).toContain(orderRes.body.orderNumber);

    const order = await Order.findById(orderRes.body.id);
    expect(order!.customerConfirmationSentAt).toBeTruthy();
  });

  it("does not send a confirmation when a gateway payment fails via webhook", async () => {
    const sendEmailSpy = mockEmailSuccess();
    const seller = await createUser("seller");
    const customerEmail = "confirm-failed@lumera.test";
    const customer = await createUser("customer", { email: customerEmail });
    const product = await createProduct(String(seller.user._id));

    const orderRes = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id), { paymentMethod: "card" }));

    const payment = await Payment.create({
      order: orderRes.body.id,
      provider: "gateway",
      transactionId: `gw_confirm_fail_${Date.now()}`,
      amount: orderRes.body.total,
      currency: "GNF",
      method: "card",
      idempotencyKey: `order:${orderRes.body.id}:confirm-fail-test`,
    });

    await paymentService.applyWebhookEvent("gateway", {
      eventId: "evt_failed_1",
      transactionId: payment.transactionId,
      status: "failed",
      amount: payment.amount,
      currency: payment.currency,
      raw: {},
    });

    expect(sendEmailSpy.mock.calls.some((c) => c[0].to === customerEmail)).toBe(false);
  });

  it("never sends a duplicate confirmation for the same order", async () => {
    const sendEmailSpy = mockEmailSuccess();
    const seller = await createUser("seller");
    const customerEmail = "confirm-dup@lumera.test";
    const customer = await createUser("customer", { email: customerEmail });
    const product = await createProduct(String(seller.user._id));

    const orderRes = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id)));

    const order = await Order.findById(orderRes.body.id);
    await notifyCustomerOrderConfirmed(order!);
    await notifyCustomerOrderConfirmed(order!);

    expect(sendEmailSpy.mock.calls.filter((c) => c[0].to === customerEmail)).toHaveLength(1);
  });

  it("does not fail order creation when the email service is unavailable", async () => {
    jest.spyOn(emailService, "sendEmail").mockRejectedValue(new Error("SMTP connection refused"));
    const seller = await createUser("seller");
    const customer = await createUser("customer", { email: "confirm-smtp-down@lumera.test" });
    const product = await createProduct(String(seller.user._id));

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id)));

    expect(res.status).toBe(201);
  });
});
