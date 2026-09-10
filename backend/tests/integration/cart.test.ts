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

  it("clamps quantity to available stock", async () => {
    const seller = await createUser("seller");
    const customer = await createUser("customer");
    const product = await createProduct(String(seller.user._id), { availableStock: 3 });

    const res = await request(app)
      .post("/api/v1/cart/items")
      .set(authHeader(customer.accessToken))
      .send({ productId: String(product._id), quantity: 50 });

    expect(res.status).toBe(201);
    expect(res.body.items[0].quantity).toBe(3);
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
});
