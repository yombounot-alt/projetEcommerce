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

    it("never lets a seller see another seller's draft products, even by targeting their id", async () => {
      const category = await createCategory();
      const sellerA = await createUser("seller", { email: "sellerA-list@lumera.test" });
      const sellerB = await createUser("seller", { email: "sellerB-list@lumera.test" });

      await request(app)
        .post("/api/v1/products")
        .set(authHeader(sellerA.accessToken))
        .send(productPayload(String(category._id), { status: "draft", sku: "SKU-DRAFT-A" }));

      // B calls the generic listing with no filter at all — must not see A's draft.
      const unfiltered = await request(app)
        .get("/api/v1/products")
        .query({ status: "draft" })
        .set(authHeader(sellerB.accessToken));
      expect(
        unfiltered.body.items.find((p: { sku: string }) => p.sku === "SKU-DRAFT-A"),
      ).toBeUndefined();

      // B explicitly targets A's id via the query param — must still be ignored server-side.
      const targeted = await request(app)
        .get("/api/v1/products")
        .query({ status: "draft", seller: sellerA.user._id.toString() })
        .set(authHeader(sellerB.accessToken));
      expect(
        targeted.body.items.find((p: { sku: string }) => p.sku === "SKU-DRAFT-A"),
      ).toBeUndefined();

      // Sanity check: A can still see their own draft via the same endpoint.
      const own = await request(app)
        .get("/api/v1/products")
        .query({ status: "draft" })
        .set(authHeader(sellerA.accessToken));
      expect(own.body.items.find((p: { sku: string }) => p.sku === "SKU-DRAFT-A")).toBeDefined();
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

  describe("Variants", () => {
    function variantPayload(categoryId: string) {
      return productPayload(categoryId, {
        sku: `SKU-VARBASE-${Date.now()}`,
        variantOptions: [{ name: "Taille", values: ["S", "M"] }],
        variants: [
          { sku: `SKU-VAR-S-${Date.now()}`, attributes: { Taille: "S" }, availableStock: 4 },
          {
            sku: `SKU-VAR-M-${Date.now()}`,
            attributes: { Taille: "M" },
            availableStock: 6,
            price: 219.99,
          },
        ],
      });
    }

    it("creates a product with variants and aggregates their stock at the top level", async () => {
      const category = await createCategory();
      const { accessToken } = await createUser("seller");

      const res = await request(app)
        .post("/api/v1/products")
        .set(authHeader(accessToken))
        .send(variantPayload(String(category._id)));

      expect(res.status).toBe(201);
      expect(res.body.variants).toHaveLength(2);
      expect(res.body.stock).toBe(10); // 4 + 6, aggregated automatically
      const variantM = res.body.variants.find(
        (v: { attributes: { Taille: string } }) => v.attributes.Taille === "M",
      );
      expect(variantM.price).toBe(219.99);
    });

    it("preserves reservedStock/soldStock of existing variants when only editing price/stock", async () => {
      const category = await createCategory();
      const { accessToken } = await createUser("seller");

      const createRes = await request(app)
        .post("/api/v1/products")
        .set(authHeader(accessToken))
        .send(variantPayload(String(category._id)));
      const variantS = createRes.body.variants.find(
        (v: { attributes: { Taille: string } }) => v.attributes.Taille === "S",
      );

      // Simulate a real reservation on that variant (as checkout would), then edit the
      // product's variants (e.g. admin bumping M's price) — S's reservation must survive.
      const { Product } = await import("../../src/models/Product");
      await Product.findOneAndUpdate(
        { _id: createRes.body.id, "variants._id": variantS.id },
        { $inc: { "variants.$.availableStock": -2, "variants.$.reservedStock": 2 } },
      );

      const updateRes = await request(app)
        .patch(`/api/v1/products/${createRes.body.id}`)
        .set(authHeader(accessToken))
        .send({
          variantOptions: [{ name: "Taille", values: ["S", "M"] }],
          variants: [
            { id: variantS.id, sku: variantS.sku, attributes: { Taille: "S" }, availableStock: 2 },
            {
              id: createRes.body.variants.find(
                (v: { attributes: { Taille: string } }) => v.attributes.Taille === "M",
              ).id,
              sku: "SKU-VAR-M-UPDATED",
              attributes: { Taille: "M" },
              availableStock: 6,
              price: 250,
            },
          ],
        });

      expect(updateRes.status).toBe(200);
      const updatedS = updateRes.body.variants.find(
        (v: { attributes: { Taille: string } }) => v.attributes.Taille === "S",
      );
      expect(updatedS.id).toBe(variantS.id); // same subdocument, not a new one

      const productDoc = await Product.findById(createRes.body.id);
      const variantSDoc = productDoc!.variants.find((v) => String(v._id) === variantS.id)!;
      expect(variantSDoc.reservedStock).toBe(2); // preserved, not reset to 0
      expect(productDoc!.reservedStock).toBe(2); // aggregate preserved too
    });
  });
});
