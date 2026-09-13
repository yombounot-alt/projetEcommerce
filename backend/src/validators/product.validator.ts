import { z } from "zod";
import { objectId } from "./common.validator";

const dimensionsSchema = z.object({
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  depth: z.coerce.number().positive(),
  unit: z.enum(["cm", "in"]).default("cm"),
});

const variantOptionSchema = z.object({
  name: z.string().trim().min(1).max(50),
  values: z.array(z.string().trim().min(1).max(50)).min(1),
});

const productVariantSchema = z.object({
  // Present when updating an existing variant (preserves its _id so cart/order references
  // stay valid); absent for a newly-added variant, which Mongoose then assigns one.
  id: objectId.optional(),
  sku: z
    .string()
    .trim()
    .min(3)
    .regex(/^[A-Za-z0-9-]+$/, "Le SKU ne peut contenir que des lettres, chiffres et tirets")
    .transform((s) => s.toUpperCase()),
  attributes: z.record(z.string().trim().min(1)),
  price: z.coerce.number().positive().optional(),
  compareAtPrice: z.coerce.number().positive().optional(),
  availableStock: z.coerce.number().int().min(0),
  image: z.string().url().optional(),
});

export const createProductSchema = z
  .object({
    name: z.string().trim().min(3).max(150),
    description: z.string().trim().min(20),
    shortDescription: z.string().trim().max(200),
    sku: z
      .string()
      .trim()
      .min(3)
      .regex(/^[A-Z0-9-]+$/, "Le SKU ne peut contenir que des majuscules, chiffres et tirets"),
    price: z.coerce.number().positive(),
    compareAtPrice: z.coerce.number().positive().optional(),
    currency: z.string().trim().length(3).optional().default("GNF"),
    categoryId: objectId,
    brandId: objectId.optional(),
    stock: z.coerce.number().int().min(0),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    weightKg: z.coerce.number().positive().optional(),
    dimensions: dimensionsSchema.optional(),
    specifications: z.record(z.string()).optional(),
    images: z.array(z.string().url()).min(1, "Au moins une image est requise").max(10),
    tags: z.array(z.string().trim().toLowerCase()).optional().default([]),
    status: z.enum(["draft", "published", "archived"]).default("draft"),
    isFeatured: z.boolean().optional().default(false),
    variantOptions: z.array(variantOptionSchema).optional().default([]),
    variants: z.array(productVariantSchema).optional().default([]),
  })
  .refine((data) => !data.compareAtPrice || data.compareAtPrice > data.price, {
    message: "Le prix barré doit être supérieur au prix de vente",
    path: ["compareAtPrice"],
  });

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(20).optional(),
    shortDescription: z.string().trim().max(200).optional(),
    price: z.coerce.number().positive().optional(),
    compareAtPrice: z.coerce.number().positive().optional(),
    currency: z.string().trim().length(3).optional(),
    categoryId: objectId.optional(),
    brandId: objectId.optional(),
    stock: z.coerce.number().int().min(0).optional(),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    weightKg: z.coerce.number().positive().optional(),
    dimensions: dimensionsSchema.optional(),
    specifications: z.record(z.string()).optional(),
    images: z.array(z.string().url()).min(1).max(10).optional(),
    tags: z.array(z.string().trim().toLowerCase()).optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    isFeatured: z.boolean().optional(),
    variantOptions: z.array(variantOptionSchema).optional(),
    variants: z.array(productVariantSchema).optional(),
  })
  .strict();

export const productListQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStockOnly: z.coerce.boolean().optional(),
  onSaleOnly: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  seller: objectId.optional(),
  sort: z.enum(["relevance", "popularity", "price_asc", "price_desc", "newest"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});
