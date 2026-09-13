import { Category } from "../../src/models/Category";
import { Product, type IProductVariant } from "../../src/models/Product";
import * as stockService from "../../src/services/stock.service";
import type { Types } from "mongoose";

function findVariant(variants: IProductVariant[], id: Types.ObjectId) {
  return variants.find((v) => String(v._id) === String(id))!;
}

async function createVariantProduct(sellerId: string) {
  const category = await Category.create({
    name: "Apparel",
    slug: `apparel-${Date.now()}-${Math.random()}`,
    isActive: true,
  });
  const product = await Product.create({
    name: "Classic T-Shirt",
    slug: `tshirt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: "Soft cotton t-shirt available in multiple sizes and colors.",
    shortDescription: "Classic t-shirt",
    sku: `SKU-VAR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    price: 50_000,
    currency: "GNF",
    images: ["https://example.com/tshirt.jpg"],
    category: category._id,
    seller: sellerId,
    availableStock: 0,
    status: "published",
    variantOptions: [
      { name: "Taille", values: ["S", "M"] },
      { name: "Couleur", values: ["Rouge"] },
    ],
    variants: [
      {
        sku: "SKU-VAR-S-ROUGE",
        attributes: { Taille: "S", Couleur: "Rouge" },
        availableStock: 5,
        reservedStock: 0,
        soldStock: 0,
      },
      {
        sku: "SKU-VAR-M-ROUGE",
        attributes: { Taille: "M", Couleur: "Rouge" },
        availableStock: 1,
        reservedStock: 0,
        soldStock: 0,
        price: 55_000,
      },
    ],
  });
  // Aggregate seeded manually above (availableStock: 0) to prove reserveStock computes it
  // correctly rather than trusting a pre-existing value — sync it the way product.service.ts
  // would on creation.
  product.availableStock = product.variants.reduce((sum, v) => sum + v.availableStock, 0);
  await product.save();
  return product;
}

describe("Variant-aware stock service", () => {
  it("reserves stock on the targeted variant only, keeping the product aggregate in sync", async () => {
    const seller = { _id: "000000000000000000000001" };
    const product = await createVariantProduct(seller._id);
    const variantS = product.variants[0];
    const variantM = product.variants[1];

    await stockService.reserveStock(
      String(product._id),
      2,
      { reason: "test" },
      String(variantS._id),
    );

    const updated = await Product.findById(product._id);
    const updatedS = findVariant(updated!.variants, variantS._id);
    const updatedM = findVariant(updated!.variants, variantM._id);

    expect(updatedS.availableStock).toBe(3); // 5 - 2
    expect(updatedS.reservedStock).toBe(2);
    expect(updatedM.availableStock).toBe(1); // untouched
    expect(updated!.availableStock).toBe(4); // aggregate: 3 + 1
    expect(updated!.reservedStock).toBe(2);
  });

  it("rejects reserving more than a variant's own stock, even if another variant has enough", async () => {
    const seller = { _id: "000000000000000000000001" };
    const product = await createVariantProduct(seller._id);
    const variantM = product.variants[1]; // only 1 in stock

    await expect(
      stockService.reserveStock(String(product._id), 5, { reason: "test" }, String(variantM._id)),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });

    const updated = await Product.findById(product._id);
    expect(findVariant(updated!.variants, variantM._id).availableStock).toBe(1); // untouched
  });

  it("never oversells the last unit of a variant under concurrent reservations", async () => {
    const seller = { _id: "000000000000000000000001" };
    const product = await createVariantProduct(seller._id);
    const variantM = product.variants[1]; // exactly 1 in stock

    const results = await Promise.allSettled([
      stockService.reserveStock(String(product._id), 1, { reason: "race-a" }, String(variantM._id)),
      stockService.reserveStock(String(product._id), 1, { reason: "race-b" }, String(variantM._id)),
    ]);

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const updated = await Product.findById(product._id);
    expect(findVariant(updated!.variants, variantM._id).availableStock).toBe(0);
    expect(findVariant(updated!.variants, variantM._id).reservedStock).toBe(1);
    expect(updated!.availableStock).toBe(5); // 5 (S) + 0 (M)
  });

  it("releases and confirms variant stock while keeping the aggregate correct", async () => {
    const seller = { _id: "000000000000000000000001" };
    const product = await createVariantProduct(seller._id);
    const variantS = product.variants[0];

    await stockService.reserveStock(
      String(product._id),
      3,
      { reason: "test" },
      String(variantS._id),
    );
    await stockService.confirmStockSale(
      String(product._id),
      2,
      { reason: "test" },
      String(variantS._id),
    );
    await stockService.releaseStock(
      String(product._id),
      1,
      { reason: "test" },
      String(variantS._id),
    );

    const updated = await Product.findById(product._id);
    const updatedS = findVariant(updated!.variants, variantS._id);
    expect(updatedS.availableStock).toBe(3); // 5 - 3 reserved + 1 released
    expect(updatedS.reservedStock).toBe(0); // 3 - 2 confirmed - 1 released
    expect(updatedS.soldStock).toBe(2);
    expect(updated!.availableStock).toBe(4); // 3 (S) + 1 (M)
    expect(updated!.soldStock).toBe(2);
  });
});
