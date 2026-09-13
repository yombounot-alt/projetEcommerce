import { FilterQuery } from "mongoose";
import {
  Product,
  type IProduct,
  type IProductVariant,
  type IProductVariantOption,
} from "../models/Product";
import { Category } from "../models/Category";
import { Brand } from "../models/Brand";
import { ForbiddenError, NotFoundError } from "../utils/AppError";
import { slugify } from "../utils/slugify";
import {
  buildPaginatedResult,
  normalizePagination,
  type PaginatedResult,
} from "../utils/pagination";
import type { Role } from "../utils/jwt";

const NEW_PRODUCT_WINDOW_DAYS = 30;

type PopulatedProduct = IProduct & {
  category: { _id: unknown; name: string; slug: string } | null;
  brand?: { _id: unknown; name: string; slug: string } | null;
};

export interface ProductDTO {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  categoryId: string;
  category: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string };
  seller: string;
  stock: number;
  weightKg?: number;
  dimensions?: IProduct["dimensions"];
  specifications: Record<string, string>;
  status: IProduct["status"];
  rating: number;
  reviewCount: number;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  variantOptions: IProductVariantOption[];
  variants: Array<{
    id: string;
    sku: string;
    attributes: Record<string, string>;
    price?: number;
    compareAtPrice?: number;
    stock: number;
    image?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export function toProductDTO(product: PopulatedProduct): ProductDTO {
  const isNew =
    Date.now() - product.createdAt.getTime() < NEW_PRODUCT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return {
    id: String(product._id),
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    images: product.images,
    categoryId: product.category ? String(product.category._id) : "",
    category: product.category
      ? {
          id: String(product.category._id),
          name: product.category.name,
          slug: product.category.slug,
        }
      : { id: "", name: "", slug: "" },
    brand: product.brand
      ? { id: String(product.brand._id), name: product.brand.name, slug: product.brand.slug }
      : undefined,
    seller: String(product.seller),
    stock: product.availableStock,
    weightKg: product.weightKg,
    dimensions: product.dimensions,
    specifications: (product.specifications as Record<string, string>) ?? {},
    status: product.status,
    rating: product.rating,
    reviewCount: product.reviewCount,
    tags: product.tags,
    isFeatured: product.isFeatured,
    isNew,
    variantOptions: product.variantOptions,
    variants: product.variants.map((v) => ({
      id: String(v._id),
      sku: v.sku,
      attributes: v.attributes,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      stock: v.availableStock,
      image: v.image,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function toProductListItemDTO(product: PopulatedProduct) {
  const dto = toProductDTO(product);
  return {
    id: dto.id,
    sku: dto.sku,
    name: dto.name,
    slug: dto.slug,
    price: dto.price,
    compareAtPrice: dto.compareAtPrice,
    currency: dto.currency,
    images: dto.images,
    category: dto.category,
    stock: dto.stock,
    status: dto.status,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    isFeatured: dto.isFeatured,
    isNew: dto.isNew,
  };
}

export interface ProductListFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  isFeatured?: boolean;
  status?: IProduct["status"];
  seller?: string;
  sort?: "relevance" | "popularity" | "price_asc" | "price_desc" | "newest";
  page?: number;
  pageSize?: number;
}

function buildSort(sort?: ProductListFilters["sort"]): Record<string, 1 | -1> {
  switch (sort) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "newest":
      return { createdAt: -1 };
    case "popularity":
      return { reviewCount: -1 };
    default:
      return { isFeatured: -1, createdAt: -1 };
  }
}

/** publicOnly=true forces status="published" regardless of the caller's filter (storefront). */
export async function listProducts(
  filters: ProductListFilters,
  publicOnly: boolean,
): Promise<PaginatedResult<ReturnType<typeof toProductListItemDTO>>> {
  const query: FilterQuery<IProduct> = {};

  if (publicOnly) {
    query.status = "published";
  } else if (filters.status) {
    query.status = filters.status;
  }

  if (filters.seller) query.seller = filters.seller;

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  if (filters.category) {
    const category = await Category.findOne({ slug: filters.category }).select("_id");
    query.category = category?._id ?? "000000000000000000000000";
  }

  if (filters.brand) {
    const brand = await Brand.findOne({ slug: filters.brand }).select("_id");
    query.brand = brand?._id ?? "000000000000000000000000";
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.price = {};
    if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
  }

  if (filters.inStockOnly) {
    query.availableStock = { $gt: 0 };
  }

  if (filters.onSaleOnly) {
    query.$expr = { $gt: ["$compareAtPrice", "$price"] };
  }

  if (filters.isFeatured !== undefined) {
    query.isFeatured = filters.isFeatured;
  }

  const { page, pageSize, skip } = normalizePagination(filters.page, filters.pageSize);

  const [items, totalItems] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort(buildSort(filters.sort))
      .skip(skip)
      .limit(pageSize),
    Product.countDocuments(query),
  ]);

  const dtos = items.map((item) => toProductListItemDTO(item as unknown as PopulatedProduct));
  return buildPaginatedResult(dtos, totalItems, page, pageSize);
}

async function populateProduct(id: string) {
  return Product.findById(id).populate("category", "name slug").populate("brand", "name slug");
}

export async function getProductById(id: string) {
  const product = await populateProduct(id);
  if (!product) throw new NotFoundError("Produit introuvable", "PRODUCT_NOT_FOUND");
  return toProductDTO(product as unknown as PopulatedProduct);
}

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug })
    .populate("category", "name slug")
    .populate("brand", "name slug");
  if (!product) return null;
  return toProductDTO(product as unknown as PopulatedProduct);
}

export async function getProductDocOrThrow(id: string) {
  const product = await Product.findById(id);
  if (!product) throw new NotFoundError("Produit introuvable", "PRODUCT_NOT_FOUND");
  return product;
}

export async function getRelatedProducts(productId: string, limit = 4) {
  const product = await Product.findById(productId);
  if (!product) return [];
  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    status: "published",
  })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .limit(limit);
  return related.map((item) => toProductListItemDTO(item as unknown as PopulatedProduct));
}

export async function getFeaturedProducts(limit = 8) {
  const products = await Product.find({ isFeatured: true, status: "published" })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit);
  return products.map((item) => toProductListItemDTO(item as unknown as PopulatedProduct));
}

export async function getNewArrivals(limit = 8) {
  const products = await Product.find({ status: "published" })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit);
  return products.map((item) => toProductListItemDTO(item as unknown as PopulatedProduct));
}

export interface CreateProductInput {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  categoryId: string;
  brandId?: string;
  stock: number;
  lowStockThreshold?: number;
  weightKg?: number;
  dimensions?: IProduct["dimensions"];
  specifications?: Record<string, string>;
  images: string[];
  tags?: string[];
  status?: IProduct["status"];
  isFeatured?: boolean;
  variantOptions?: IProductVariantOption[];
  variants?: VariantInput[];
}

interface VariantInput {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  price?: number;
  compareAtPrice?: number;
  availableStock: number;
  image?: string;
}

/**
 * Builds the variants subdocument array from admin input, preserving reservedStock/soldStock
 * for variants matched by `id` (an in-flight reservation/sale must never be reset to 0 just
 * because an admin edited the price or added another variant) — only availableStock is ever
 * admin-settable directly. A variant with no `id` is treated as new (reservedStock/soldStock
 * start at 0, Mongoose assigns a fresh `_id`).
 */
function buildVariantsArray(
  input: VariantInput[],
  existingVariants: IProductVariant[] = [],
): Partial<IProductVariant>[] {
  return input.map((v) => {
    const existing = v.id ? existingVariants.find((e) => String(e._id) === v.id) : undefined;
    return {
      _id: existing?._id,
      sku: v.sku,
      attributes: v.attributes,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      availableStock: v.availableStock,
      reservedStock: existing?.reservedStock ?? 0,
      soldStock: existing?.soldStock ?? 0,
      image: v.image,
    };
  });
}

function computeStockAggregates(
  variants: Array<Pick<IProductVariant, "availableStock" | "reservedStock" | "soldStock">>,
) {
  return {
    availableStock: variants.reduce((sum, v) => sum + v.availableStock, 0),
    reservedStock: variants.reduce((sum, v) => sum + v.reservedStock, 0),
    soldStock: variants.reduce((sum, v) => sum + v.soldStock, 0),
  };
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;
  while (await Product.exists({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function createProduct(sellerId: string, input: CreateProductInput) {
  const category = await Category.findById(input.categoryId);
  if (!category) throw new NotFoundError("Catégorie introuvable", "CATEGORY_NOT_FOUND");

  if (input.brandId) {
    const brand = await Brand.findById(input.brandId);
    if (!brand) throw new NotFoundError("Marque introuvable", "BRAND_NOT_FOUND");
  }

  const slug = await uniqueSlug(input.name);

  const variants = input.variants?.length ? buildVariantsArray(input.variants) : [];
  const stockOverride =
    variants.length > 0 ? computeStockAggregates(variants as IProductVariant[]) : null;

  const product = await Product.create({
    name: input.name,
    slug,
    description: input.description,
    shortDescription: input.shortDescription,
    sku: input.sku,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    currency: input.currency ?? "GNF",
    category: input.categoryId,
    brand: input.brandId,
    seller: sellerId,
    availableStock: stockOverride ? stockOverride.availableStock : input.stock,
    lowStockThreshold: input.lowStockThreshold ?? 5,
    weightKg: input.weightKg,
    dimensions: input.dimensions,
    specifications: input.specifications ?? {},
    images: input.images,
    tags: input.tags ?? [],
    status: input.status ?? "draft",
    isFeatured: input.isFeatured ?? false,
    variantOptions: input.variantOptions ?? [],
    variants,
  });

  return getProductById(String(product._id));
}

function assertOwnership(product: IProduct, actorId: string, role: Role): void {
  if (role === "admin") return;
  if (role === "seller" && String(product.seller) === actorId) return;
  throw new ForbiddenError(
    "Vous n'avez pas la permission de gérer ce produit",
    "NOT_PRODUCT_OWNER",
  );
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, "sku" | "stock">>;

export async function updateProduct(
  id: string,
  actorId: string,
  role: Role,
  changes: UpdateProductInput & { categoryId?: string; brandId?: string },
) {
  const product = await getProductDocOrThrow(id);
  assertOwnership(product, actorId, role);

  if (changes.categoryId) {
    const category = await Category.findById(changes.categoryId);
    if (!category) throw new NotFoundError("Catégorie introuvable", "CATEGORY_NOT_FOUND");
    product.category = category._id;
  }
  if (changes.brandId) {
    const brand = await Brand.findById(changes.brandId);
    if (!brand) throw new NotFoundError("Marque introuvable", "BRAND_NOT_FOUND");
    product.brand = brand._id;
  }

  const { categoryId: _categoryId, brandId: _brandId, variants: variantsInput, ...rest } = changes;
  Object.assign(product, rest);

  if (variantsInput !== undefined) {
    const variants = buildVariantsArray(variantsInput, product.variants);
    product.variants = variants as IProduct["variants"];
    const aggregates = computeStockAggregates(variants as IProductVariant[]);
    product.availableStock = aggregates.availableStock;
    product.reservedStock = aggregates.reservedStock;
    product.soldStock = aggregates.soldStock;
  }

  if (changes.name) {
    product.slug = await uniqueSlug(changes.name);
  }

  await product.save();
  return getProductById(id);
}

export async function deleteProduct(id: string, actorId: string, role: Role) {
  const product = await getProductDocOrThrow(id);
  assertOwnership(product, actorId, role);
  await product.deleteOne();
}
