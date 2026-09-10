import { app, request, createUser, authHeader } from "../helpers";
import { Category } from "../../src/models/Category";

async function createCategory() {
  return Category.create({ name: "Electronics", slug: "electronics", isActive: true });
}

function productPayload(categoryId: string, overrides: Record<string, unknown> = {}) {
  return {
    name: "Wireless Headphones",
    description: "High quality wireless headphones with noise cancellation and long battery life.",
    shortDescription: "Wireless headphones",
    sku: "SKU-TEST-001",
    price: 199.99,
    categoryId,
    stock: 10,
    images: ["https://example.com/image.jpg"],
    status: "published",
    ...overrides,
  };
}

describe("Products", () => {
  describe("POST /api/v1/products", () => {
    it("rejects unauthenticated creation", async () => {
      const category = await createCategory();
      const res = await request(app)
        .post("/api/v1/products")
        .send(productPayload(String(category._id)));
      expect(res.status).toBe(401);
    });

    it("rejects a customer trying to create a product", async () => {
      const category = await createCategory();
      const { accessToken } = await createUser("customer");
      const res = await request(app)
        .post("/api/v1/products")
        .set(authHeader(accessToken))
        .send(productPayload(String(category._id)));
      expect(res.status).toBe(403);
    });

    it("allows a seller to create a product", async () => {
      const category = await createCategory();
      const { accessToken } = await createUser("seller");
      const res = await request(app)
        .post("/api/v1/products")
        .set(authHeader(accessToken))
        .send(productPayload(String(category._id)));

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Wireless Headphones");
      expect(res.body.stock).toBe(10);
      expect(res.body.category.slug).toBe("electronics");
    });
  });

  describe("Ownership", () => {
    it("prevents a seller from updating another seller's product", async () => {
      const category = await createCategory();
      const sellerA = await createUser("seller", { email: "sellerA@lumera.test" });
      const sellerB = await createUser("seller", { email: "sellerB@lumera.test" });

      const createRes = await request(app)
        .post("/api/v1/products")
        .set(authHeader(sellerA.accessToken))
        .send(productPayload(String(category._id)));

      const res = await request(app)
        .patch(`/api/v1/products/${createRes.body.id}`)
        .set(authHeader(sellerB.accessToken))
        .send({ price: 50 });

      expect(res.status).toBe(403);
    });

    it("allows an admin to update any seller's product", async () => {
      const category = await createCategory();
      const seller = await createUser("seller", { email: "seller-own@lumera.test" });
      const admin = await createUser("admin", { email: "admin-own@lumera.test" });

      const createRes = await request(app)
        .post("/api/v1/products")
        .set(authHeader(seller.accessToken))
        .send(productPayload(String(category._id)));

      const res = await request(app)
        .patch(`/api/v1/products/${createRes.body.id}`)
        .set(authHeader(admin.accessToken))
        .send({ price: 250 });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(250);
    });
  });

  describe("GET /api/v1/products", () => {
    it("paginates and filters published products", async () => {
      const category = await createCategory();
      const { accessToken } = await createUser("seller");

      for (let i = 0; i < 3; i += 1) {
        await request(app)
          .post("/api/v1/products")
          .set(authHeader(accessToken))
          .send(
            productPayload(String(category._id), {
              sku: `SKU-LIST-${i}`,
              name: `Product ${i}`,
              price: 10 * (i + 1),
            }),
          );
      }

      const res = await request(app).get("/api/v1/products").query({ page: 1, pageSize: 2 });

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.pagination.totalItems).toBe(3);
      expect(res.body.pagination.totalPages).toBe(2);
    });

    it("does not list draft products to public customers", async () => {
      const category = await createCategory();
      const { accessToken } = await createUser("seller");

      await request(app)
        .post("/api/v1/products")
        .set(authHeader(accessToken))
        .send(productPayload(String(category._id), { status: "draft", sku: "SKU-DRAFT" }));

      const res = await request(app).get("/api/v1/products");
      expect(res.body.items.find((p: { sku: string }) => p.sku === "SKU-DRAFT")).toBeUndefined();
    });
  });

  describe("DELETE /api/v1/products/:id", () => {
    it("allows the owning seller to delete their product", async () => {
      const category = await createCategory();
      const { accessToken } = await createUser("seller");
      const createRes = await request(app)
        .post("/api/v1/products")
        .set(authHeader(accessToken))
        .send(productPayload(String(category._id)));

      const res = await request(app)
        .delete(`/api/v1/products/${createRes.body.id}`)
        .set(authHeader(accessToken));
      expect(res.status).toBe(204);

      const getRes = await request(app).get(`/api/v1/products/${createRes.body.id}`);
      expect(getRes.status).toBe(404);
    });
  });
});
