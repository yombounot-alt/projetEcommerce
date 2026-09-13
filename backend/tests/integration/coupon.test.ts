import { app, request, createUser, authHeader } from "../helpers";
import { Category } from "../../src/models/Category";
import { Product } from "../../src/models/Product";
import { Coupon } from "../../src/models/Coupon";

async function createProduct(sellerId: string, price = 100_000) {
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
    sku: `SKU-CPN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    price,
    currency: "GNF",
    images: ["https://example.com/speaker.jpg"],
    category: category._id,
    seller: sellerId,
    availableStock: 10,
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

describe("Coupons", () => {
  describe("Admin CRUD", () => {
    it("rejects a non-admin trying to create a coupon", async () => {
      const { accessToken } = await createUser("customer");
      const res = await request(app)
        .post("/api/v1/coupons")
        .set(authHeader(accessToken))
        .send({ code: "TEST10", type: "percentage", value: 10 });
      expect(res.status).toBe(403);
    });

    it("lets an admin create, list, update and delete a coupon", async () => {
      const { accessToken } = await createUser("admin");

      const createRes = await request(app)
        .post("/api/v1/coupons")
        .set(authHeader(accessToken))
        .send({ code: "summer20", type: "percentage", value: 20 });
      expect(createRes.status).toBe(201);
      expect(createRes.body.code).toBe("SUMMER20"); // normalized to uppercase

      const listRes = await request(app).get("/api/v1/coupons").set(authHeader(accessToken));
      expect(listRes.status).toBe(200);
      expect(listRes.body.items.some((c: { code: string }) => c.code === "SUMMER20")).toBe(true);

      const updateRes = await request(app)
        .patch(`/api/v1/coupons/${createRes.body.id}`)
        .set(authHeader(accessToken))
        .send({ isActive: false });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.isActive).toBe(false);

      const deleteRes = await request(app)
        .delete(`/api/v1/coupons/${createRes.body.id}`)
        .set(authHeader(accessToken));
      expect(deleteRes.status).toBe(204);
    });

    it("rejects creating a coupon with a duplicate code", async () => {
      const { accessToken } = await createUser("admin");
      await Coupon.create({ code: "DUPTEST", type: "fixed", value: 1000 });

      const res = await request(app)
        .post("/api/v1/coupons")
        .set(authHeader(accessToken))
        .send({ code: "duptest", type: "fixed", value: 500 });
      expect(res.status).toBe(409);
    });

    it("rejects a percentage coupon over 100", async () => {
      const { accessToken } = await createUser("admin");
      const res = await request(app)
        .post("/api/v1/coupons")
        .set(authHeader(accessToken))
        .send({ code: "TOOBIG", type: "percentage", value: 150 });
      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/v1/coupons/apply (preview)", () => {
    it("rejects an unknown code", async () => {
      const { accessToken } = await createUser("customer");
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .set(authHeader(accessToken))
        .send({ code: "NOPE", subtotal: 10000 });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_COUPON");
    });

    it("rejects an inactive coupon", async () => {
      await Coupon.create({ code: "OFFCODE", type: "fixed", value: 1000, isActive: false });
      const { accessToken } = await createUser("customer");
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .set(authHeader(accessToken))
        .send({ code: "OFFCODE", subtotal: 10000 });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("COUPON_INACTIVE");
    });

    it("rejects an expired coupon", async () => {
      await Coupon.create({
        code: "OLDCODE",
        type: "fixed",
        value: 1000,
        expiresAt: new Date(Date.now() - 60_000),
      });
      const { accessToken } = await createUser("customer");
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .set(authHeader(accessToken))
        .send({ code: "OLDCODE", subtotal: 10000 });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("COUPON_EXPIRED");
    });

    it("rejects a coupon that already reached its usage cap", async () => {
      await Coupon.create({
        code: "MAXEDOUT",
        type: "fixed",
        value: 1000,
        maxUses: 1,
        usedCount: 1,
      });
      const { accessToken } = await createUser("customer");
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .set(authHeader(accessToken))
        .send({ code: "MAXEDOUT", subtotal: 10000 });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("COUPON_EXHAUSTED");
    });

    it("rejects a coupon below its minimum subtotal", async () => {
      await Coupon.create({ code: "BIGORDER", type: "fixed", value: 1000, minSubtotal: 50000 });
      const { accessToken } = await createUser("customer");
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .set(authHeader(accessToken))
        .send({ code: "BIGORDER", subtotal: 10000 });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("COUPON_MIN_SUBTOTAL");
    });

    it("accepts a valid coupon", async () => {
      await Coupon.create({ code: "VALIDONE", type: "percentage", value: 15 });
      const { accessToken } = await createUser("customer");
      const res = await request(app)
        .post("/api/v1/coupons/apply")
        .set(authHeader(accessToken))
        .send({ code: "VALIDONE", subtotal: 10000 });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe("VALIDONE");
    });
  });

  describe("Checkout integration", () => {
    it("applies the discount and increments usedCount when a real order is placed", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id), 100_000);
      const coupon = await Coupon.create({ code: "ORDER10", type: "percentage", value: 10 });

      const res = await request(app)
        .post("/api/v1/orders")
        .set(authHeader(customer.accessToken))
        .send(checkoutPayload(String(product._id), { couponCode: "ORDER10" }));

      expect(res.status).toBe(201);
      expect(res.body.discount).toBe(10_000); // 10% of 100 000
      expect(res.body.couponCode).toBe("ORDER10");

      const updated = await Coupon.findById(coupon._id);
      expect(updated!.usedCount).toBe(1);
    });

    it("rejects checkout with an invalid coupon code", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createProduct(String(seller.user._id));

      const res = await request(app)
        .post("/api/v1/orders")
        .set(authHeader(customer.accessToken))
        .send(checkoutPayload(String(product._id), { couponCode: "GHOSTCODE" }));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_COUPON");
    });

    it("never lets usedCount exceed maxUses under concurrent checkouts", async () => {
      const seller = await createUser("seller");
      const product = await createProduct(String(seller.user._id), 50_000);
      await Coupon.create({ code: "LIMITED1", type: "fixed", value: 5000, maxUses: 1 });

      const customerA = await createUser("customer", { email: "couponA@lumera.test" });
      const customerB = await createUser("customer", { email: "couponB@lumera.test" });

      const [resA, resB] = await Promise.all([
        request(app)
          .post("/api/v1/orders")
          .set(authHeader(customerA.accessToken))
          .send(checkoutPayload(String(product._id), { couponCode: "LIMITED1" })),
        request(app)
          .post("/api/v1/orders")
          .set(authHeader(customerB.accessToken))
          .send(checkoutPayload(String(product._id), { couponCode: "LIMITED1" })),
      ]);

      // Both orders succeed (validateCoupon only checks the cap at the moment it runs), but
      // the atomic $inc guard must still cap real usedCount at maxUses, never exceeding it.
      expect(resA.status).toBe(201);
      expect(resB.status).toBe(201);

      const coupon = await Coupon.findOne({ code: "LIMITED1" });
      expect(coupon!.usedCount).toBeLessThanOrEqual(1);
    });
  });
});
