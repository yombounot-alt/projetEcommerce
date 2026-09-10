import { app, request, createUser, authHeader } from "../helpers";
import { Category } from "../../src/models/Category";
import { Product } from "../../src/models/Product";

async function createProduct(sellerId: string, overrides: Record<string, unknown> = {}) {
  const category = await Category.create({
    name: "Electronics",
    slug: `electronics-${Date.now()}-${Math.random()}`,
    isActive: true,
  });
  return Product.create({
    name: "Bluetooth Speaker",
    slug: `speaker-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: "Portable bluetooth speaker with 12h battery life and deep bass.",
    shortDescription: "Bluetooth speaker",
    sku: `SKU-ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    price: 100,
    currency: "GNF",
    images: ["https://example.com/speaker.jpg"],
    category: category._id,
    seller: sellerId,
    availableStock: 5,
    status: "published",
    ...overrides,
  });
}

function checkoutPayload(productId: string, quantity = 1, overrides: Record<string, unknown> = {}) {
  return {
    items: [{ productId, quantity }],
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

describe("Orders (checkout)", () => {
  it("creates an order with server-computed totals and reserves stock", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id), { availableStock: 5, price: 100 });

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id), 2));

    expect(res.status).toBe(201);
    expect(res.body.subtotal).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(200);
    expect(res.body.status).toBe("pending");
    expect(res.body.items[0].unitPrice).toBe(100);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct!.availableStock).toBe(3);
    expect(updatedProduct!.reservedStock).toBe(2);
  });

  it("ignores a client-supplied price and always uses the DB price", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id), { price: 100 });

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(
        checkoutPayload(String(product._id), 1, {
          // Deliberately injecting a bogus client-side price to prove the server ignores it.
          items: [{ productId: String(product._id), quantity: 1, price: 1 }],
        }),
      );

    expect(res.status).toBe(201);
    expect(res.body.items[0].unitPrice).toBe(100);
    expect(res.body.subtotal).toBe(100);
  });

  it("rejects checkout when requested quantity exceeds available stock", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id), { availableStock: 1 });

    const res = await request(app)
      .post("/api/v1/orders")
      .set(authHeader(customer.accessToken))
      .send(checkoutPayload(String(product._id), 5));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INSUFFICIENT_STOCK");

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct!.availableStock).toBe(1); // untouched — no partial reservation
  });

  describe("Access control", () => {
    it("prevents a customer from viewing another customer's order", async () => {
      const seller = await createUser("seller");
      const customerA = await createUser("customer", { email: "orderA@lumera.test" });
      const customerB = await createUser("customer", { email: "orderB@lumera.test" });
      const product = await createProduct(String(seller.user._id));

      const createRes = await request(app)
        .post("/api/v1/orders")
        .set(authHeader(customerA.accessToken))
        .send(checkoutPayload(String(product._id)));

      const res = await request(app)
        .get(`/api/v1/orders/${createRes.body.id}`)
        .set(authHeader(customerB.accessToken));

      expect(res.status).toBe(403);
    });

    it("allows the seller who owns an order item to view the order", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id));

      const createRes = await request(app)
        .post("/api/v1/orders")
        .set(authHeader(customer.accessToken))
        .send(checkoutPayload(String(product._id)));

      const res = await request(app)
        .get(`/api/v1/orders/${createRes.body.id}`)
        .set(authHeader(seller.accessToken));

      expect(res.status).toBe(200);
    });
  });

  describe("Status transitions", () => {
    it("releases stock when a pending order is cancelled", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id), { availableStock: 5 });

      const createRes = await request(app)
        .post("/api/v1/orders")
        .set(authHeader(customer.accessToken))
        .send(checkoutPayload(String(product._id), 2));

      const res = await request(app)
        .patch(`/api/v1/orders/${createRes.body.id}/status`)
        .set(authHeader(customer.accessToken))
        .send({ status: "cancelled" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("cancelled");

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct!.availableStock).toBe(5);
      expect(updatedProduct!.reservedStock).toBe(0);
    });

    it("rejects an invalid status transition", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id));

      const createRes = await request(app)
        .post("/api/v1/orders")
        .set(authHeader(customer.accessToken))
        .send(checkoutPayload(String(product._id)));

      const res = await request(app)
        .patch(`/api/v1/orders/${createRes.body.id}/status`)
        .set(authHeader(customer.accessToken))
        .send({ status: "shipped" });

      expect(res.status).toBe(403); // customers may only cancel
    });
  });
});
