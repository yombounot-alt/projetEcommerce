import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { PAGE_SIZE_DEFAULT } from "@/constants/app.constants";
import { mockDelay } from "@/lib/mock-delay";
import { mockCategories } from "@/mocks/categories";
import { getRelatedProducts, mockProducts } from "@/mocks/products";
import { getReviewsByProduct } from "@/mocks/reviews";
import type { PaginatedResponse } from "@/types/common.types";
import type { Category, Product, ProductFilters, ProductListItem, ProductReview } from "@/types/product.types";

function applyFilters(filters: ProductFilters): Product[] {
  let results = [...mockProducts].filter((p) => p.status === "published");

  if (filters.search) {
    const query = filters.search.trim().toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some((tag) => tag.includes(query)),
    );
  }

  if (filters.category) {
    results = results.filter((p) => p.category.slug === filters.category);
  }

  if (filters.brand) {
    results = results.filter((p) => p.brand?.slug === filters.brand);
  }

  if (typeof filters.minPrice === "number") {
    results = results.filter((p) => p.price >= filters.minPrice!);
  }

  if (typeof filters.maxPrice === "number") {
    results = results.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.inStockOnly) {
    results = results.filter((p) => p.stock > 0);
  }

  if (filters.onSaleOnly) {
    results = results.filter((p) => !!p.compareAtPrice && p.compareAtPrice > p.price);
  }

  switch (filters.sort) {
    case "price_asc":
      results.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      results.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      break;
    case "popularity":
      results.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    default:
      results.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  return results;
}

function toListItem(product: Product): ProductListItem {
  const {
    id, sku, name, slug, price, compareAtPrice, currency, images,
    category, stock, status, rating, reviewCount, isFeatured, isNew,
  } = product;
  return { id, sku, name, slug, price, compareAtPrice, currency, images, category, stock, status, rating, reviewCount, isFeatured, isNew };
}

export const productService = {
  async list(filters: ProductFilters = {}): Promise<PaginatedResponse<ProductListItem>> {
    if (env.useMocks) {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? PAGE_SIZE_DEFAULT;
      const filtered = applyFilters(filters);
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize).map(toListItem);

      return mockDelay({
        items,
        pagination: {
          page,
          pageSize,
          totalItems: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        },
      });
    }

    const { data } = await httpClient.get<PaginatedResponse<ProductListItem>>("/products", { params: filters });
    return data;
  },

  async getBySlug(slug: string): Promise<Product | null> {
    if (env.useMocks) {
      const product = mockProducts.find((p) => p.slug === slug) ?? null;
      return mockDelay(product, 250);
    }
    const { data } = await httpClient.get<Product>(`/products/slug/${slug}`);
    return data;
  },

  async getRelated(product: Product, limit = 4): Promise<ProductListItem[]> {
    if (env.useMocks) {
      return mockDelay(getRelatedProducts(product, limit).map(toListItem), 200);
    }
    const { data } = await httpClient.get<ProductListItem[]>(`/products/${product.id}/related`, { params: { limit } });
    return data;
  },

  async getReviews(productId: string): Promise<ProductReview[]> {
    if (env.useMocks) {
      return mockDelay(getReviewsByProduct(productId), 200);
    }
    const { data } = await httpClient.get<ProductReview[]>(`/products/${productId}/reviews`);
    return data;
  },

  async getFeatured(limit = 8): Promise<ProductListItem[]> {
    if (env.useMocks) {
      const featured = mockProducts.filter((p) => p.isFeatured && p.status === "published").slice(0, limit);
      return mockDelay(featured.map(toListItem), 250);
    }
    const { data } = await httpClient.get<ProductListItem[]>("/products/featured", { params: { limit } });
    return data;
  },

  async getNewArrivals(limit = 8): Promise<ProductListItem[]> {
    if (env.useMocks) {
      const newest = [...mockProducts]
        .filter((p) => p.status === "published")
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, limit);
      return mockDelay(newest.map(toListItem), 250);
    }
    const { data } = await httpClient.get<ProductListItem[]>("/products/new", { params: { limit } });
    return data;
  },
};

export const categoryService = {
  async list(): Promise<Category[]> {
    if (env.useMocks) {
      return mockDelay(mockCategories, 200);
    }
    const { data } = await httpClient.get<Category[]>("/categories");
    return data;
  },

  async getBySlug(slug: string): Promise<Category | null> {
    if (env.useMocks) {
      return mockDelay(mockCategories.find((c) => c.slug === slug) ?? null, 150);
    }
    const { data } = await httpClient.get<Category>(`/categories/slug/${slug}`);
    return data;
  },
};
