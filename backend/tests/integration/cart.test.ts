import { app, request, createUser, authHeader } from "../helpers";
import { Category } from "../../src/models/Category";
import { Product } from "../../src/models/Product";

async function createProduct(sellerId: string, overrides: Record<string, unknown> = {}) {
  const category = await Category.create({
    name: "Home",
    slug: `home-${Date.now()}`,
    isActive: true,
  });
  return Product.create({
    name: "Desk Lamp",
    slug: `desk-lamp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: "A simple desk lamp for the home office, energy efficient LED bulb included.",
    shortDescription: "Desk lamp",
    sku: `SKU-CART-${Date.now()}`,
    price: 25,
    currency: "GNF",
    images: ["https://example.com/lamp.jpg"],
    category: category._id,
    seller: sellerId,
    availableStock: 5,
    status: "published",
    ...overrides,
  });
}

describe("Cart", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/v1/cart");
    expect(res.status).toBe(401);
  });

  it("adds an item and recomputes price/subtotal from the live product", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id));

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.accessToken))
      .send({ productId: String(product._id), quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].price).toBe(25);
    expect(res.body.subtotal).toBe(50);
  });

  it("rejects a quantity greater than available stock instead of silently clamping it", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id), { availableStock: 3 });

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.accessToken))
      .send({ productId: String(product._id), quantity: 50 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INSUFFICIENT_STOCK");
  });

  it("rejects adding more of an item already in the cart past available stock", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id), { availableStock: 3 });

    await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.accessToken))
      .send({ productId: String(product._id), quantity: 2 });

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.accessToken))
      .send({ productId: String(product._id), quantity: 2 }); // 2 + 2 > 3 in stock

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INSUFFICIENT_STOCK");
  });

  it("rejects updating an item's quantity past available stock", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id), { availableStock: 3 });

    await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.accessToken))
      .send({ productId: String(product._id), quantity: 1 });

    const res = await request(app)
      .patch(`/api/v1/cart/items/${product._id}`)
      .set(authHeader(customer.accessToken))
      .send({ quantity: 10 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INSUFFICIENT_STOCK");
  });

  it("never loses an update under concurrent add-to-cart requests for the same item", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id), { availableStock: 10 });

    const [resA, resB] = await Promise.all([
      request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(customer.accessToken))
        .send({ productId: String(product._id), quantity: 2 }),
      request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(customer.accessToken))
        .send({ productId: String(product._id), quantity: 3 }),
    ]);

    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);

    const finalRes = await request(app).get("/api/v1/cart").set(authHeader(customer.accessToken));
    // Both increments must be reflected — 2 + 3 = 5, never just 2 or just 3 (lost update).
    expect(finalRes.body.items[0].quantity).toBe(5);
  });

  it("rejects adding an out-of-stock product", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id), { availableStock: 0 });

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.accessToken))
      .send({ productId: String(product._id), quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("OUT_OF_STOCK");
  });

  it("removes an item from the cart", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id));

    await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.accessToken))
      .send({ productId: String(product._id), quantity: 1 });

    const res = await request(app)
      .delete(`/api/v1/cart/items/${product._id}`)
      .set(authHeader(customer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  describe("Variant products", () => {
    async function createVariantProduct(sellerId: string) {
      const category = await Category.create({
        name: "Apparel",
        slug: `apparel-cart-${Date.now()}-${Math.random()}`,
        isActive: true,
      });
      return Product.create({
        name: "Classic T-Shirt",
        slug: `tshirt-cart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        description: "Soft cotton t-shirt available in multiple sizes.",
        shortDescription: "Classic t-shirt",
        sku: `SKU-CARTVAR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        price: 50_000,
        currency: "GNF",
        images: ["https://example.com/tshirt.jpg"],
        category: category._id,
        seller: sellerId,
        availableStock: 8,
        status: "published",
        variantOptions: [{ name: "Taille", values: ["S", "M"] }],
        variants: [
          { sku: "SKU-CARTVAR-S", attributes: { Taille: "S" }, availableStock: 5 },
          { sku: "SKU-CARTVAR-M", attributes: { Taille: "M" }, availableStock: 3, price: 55_000 },
        ],
      });
    }

    it("rejects adding a variant product without specifying a variant", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createVariantProduct(String(seller.user._id));

      const res = await request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(customer.accessToken))
        .send({ productId: String(product._id), quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VARIANT_REQUIRED");
    });

    it("rejects an unknown variant id for the product", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createVariantProduct(String(seller.user._id));

      const res = await request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(customer.accessToken))
        .send({
          productId: String(product._id),
          variantId: "000000000000000000000099",
          quantity: 1,
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe("VARIANT_NOT_FOUND");
    });

    it("adds two different variants of the same product as separate lines with the variant's own price", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createVariantProduct(String(seller.user._id));
      const [variantS, variantM] = product.variants;

      await request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(customer.accessToken))
        .send({ productId: String(product._id), variantId: String(variantS._id), quantity: 2 });
      const res = await request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(customer.accessToken))
        .send({ productId: String(product._id), variantId: String(variantM._id), quantity: 1 });

      expect(res.status).toBe(201);
      expect(res.body.items).toHaveLength(2);
      const lineS = res.body.items.find(
        (i: { variantId: string }) => i.variantId === String(variantS._id),
      );
      const lineM = res.body.items.find(
        (i: { variantId: string }) => i.variantId === String(variantM._id),
      );
      expect(lineS.quantity).toBe(2);
      expect(lineS.price).toBe(50_000); // no override — falls back to product price
      expect(lineS.variantLabel).toBe("S");
      expect(lineM.quantity).toBe(1);
      expect(lineM.price).toBe(55_000); // variant price override
      expect(lineM.variantLabel).toBe("M");
    });

    it("rejects a quantity exceeding a specific variant's own stock", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createVariantProduct(String(seller.user._id));
      const variantM = product.variants[1]; // only 3 in stock

      const res = await request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(customer.accessToken))
        .send({ productId: String(product._id), variantId: String(variantM._id), quantity: 10 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INSUFFICIENT_STOCK");
    });

    it("removes only the targeted variant's line, leaving the other variant untouched", async () => {
      const seller = await createUser("seller");
      const customer = await createUser("customer");
      const product = await createVariantProduct(String(seller.user._id));
      const [variantS, variantM] = product.variants;

      await request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(customer.accessToken))
        .send({ productId: String(product._id), variantId: String(variantS._id), quantity: 1 });
      await request(app)
        .post("/api/v1/cart/items")
        .set(authHeader(customer.accessToken))
        .send({ productId: String(product._id), variantId: String(variantM._id), quantity: 1 });

      const res = await request(app)
        .delete(`/api/v1/cart/items/${product._id}?variantId=${variantS._id}`)
        .set(authHeader(customer.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].variantId).toBe(String(variantM._id));
    });
  });
});
