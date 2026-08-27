import type { ISODateString, UUID } from "./common.types";

export type ProductStatus = "draft" | "published" | "archived";

export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: UUID | null;
  productCount: number;
}

export interface Brand {
  id: UUID;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
  unit: "cm" | "in";
}

export interface ProductReview {
  id: UUID;
  productId: UUID;
  authorName: string;
  authorAvatarUrl?: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: ISODateString;
  verifiedPurchase: boolean;
}

export interface Product {
  id: UUID;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  categoryId: UUID;
  category: Pick<Category, "id" | "name" | "slug">;
  brand?: Pick<Brand, "id" | "name" | "slug">;
  stock: number;
  weightKg?: number;
  dimensions?: ProductDimensions;
  status: ProductStatus;
  rating: number;
  reviewCount: number;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ProductListItem
  extends Pick<
    Product,
    | "id"
    | "sku"
    | "name"
    | "slug"
    | "price"
    | "compareAtPrice"
    | "currency"
    | "images"
    | "category"
    | "stock"
    | "status"
    | "rating"
    | "reviewCount"
    | "isFeatured"
    | "isNew"
  > {}

export type ProductSortOption =
  | "relevance"
  | "popularity"
  | "price_asc"
  | "price_desc"
  | "newest";

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: ProductSortOption;
  page?: number;
  pageSize?: number;
}
