import { describe, expect, it } from "vitest";
import {
  productFormSchema,
  productVariantFormSchema,
  variantOptionFormSchema,
} from "./product.schema";

const baseProduct = {
  name: "Produit de test",
  description: "Une description suffisamment longue pour passer la validation.",
  shortDescription: "Description courte",
  sku: "SKU-TEST-001",
  price: 100,
  categoryId: "cat-1",
  stock: 10,
  images: ["https://example.com/image.jpg"],
  status: "draft" as const,
};

describe("productFormSchema", () => {
  it("accepte un produit valide sans variantes", () => {
    const result = productFormSchema.safeParse(baseProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variantOptions).toEqual([]);
      expect(result.data.variants).toEqual([]);
    }
  });

  it("rejette si le prix barré n'est pas supérieur au prix de vente", () => {
    const result = productFormSchema.safeParse({ ...baseProduct, compareAtPrice: 100 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["compareAtPrice"]);
    }
  });

  it("accepte un prix barré strictement supérieur au prix", () => {
    const result = productFormSchema.safeParse({ ...baseProduct, compareAtPrice: 150 });
    expect(result.success).toBe(true);
  });

  it("rejette une image qui n'est pas une URL", () => {
    const result = productFormSchema.safeParse({ ...baseProduct, images: ["pas-une-url"] });
    expect(result.success).toBe(false);
  });

  it("rejette un tableau d'images vide", () => {
    const result = productFormSchema.safeParse({ ...baseProduct, images: [] });
    expect(result.success).toBe(false);
  });

  it("coerce les champs numériques envoyés sous forme de chaîne (inputs HTML)", () => {
    const result = productFormSchema.safeParse({ ...baseProduct, price: "100", stock: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(100);
      expect(result.data.stock).toBe(10);
    }
  });
});

describe("variantOptionFormSchema", () => {
  it("accepte une option avec au moins une valeur", () => {
    expect(variantOptionFormSchema.safeParse({ name: "Taille", values: ["S", "M"] }).success).toBe(
      true,
    );
  });

  it("rejette une option sans valeur", () => {
    expect(variantOptionFormSchema.safeParse({ name: "Taille", values: [] }).success).toBe(false);
  });

  it("rejette une option sans nom", () => {
    expect(variantOptionFormSchema.safeParse({ name: "", values: ["S"] }).success).toBe(false);
  });
});

describe("productVariantFormSchema", () => {
  const baseVariant = { sku: "var-sku-1", attributes: { Taille: "M" }, availableStock: 5 };

  it("accepte une variante valide et met le SKU en majuscules", () => {
    const result = productVariantFormSchema.safeParse(baseVariant);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sku).toBe("VAR-SKU-1");
    }
  });

  it("rejette un SKU avec des caractères non autorisés", () => {
    const result = productVariantFormSchema.safeParse({ ...baseVariant, sku: "var sku!" });
    expect(result.success).toBe(false);
  });

  it("rejette un stock négatif", () => {
    const result = productVariantFormSchema.safeParse({ ...baseVariant, availableStock: -1 });
    expect(result.success).toBe(false);
  });

  it("accepte un prix et un prix barré optionnels, coercés en nombre", () => {
    const result = productVariantFormSchema.safeParse({
      ...baseVariant,
      price: "95",
      compareAtPrice: "120",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(95);
      expect(result.data.compareAtPrice).toBe(120);
    }
  });

  it("rejette un prix négatif ou nul", () => {
    const result = productVariantFormSchema.safeParse({ ...baseVariant, price: 0 });
    expect(result.success).toBe(false);
  });

  it("accepte plusieurs attributs (ex: Taille + Couleur)", () => {
    const result = productVariantFormSchema.safeParse({
      ...baseVariant,
      attributes: { Taille: "M", Couleur: "Rouge" },
    });
    expect(result.success).toBe(true);
  });
});
