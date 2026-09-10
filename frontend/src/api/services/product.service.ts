import { httpClient } from "@/api/client/axios";
import { env } from "@/app/config/env";
import { PAGE_SIZE_DEFAULT } from "@/constants/app.constants";
import { mockDelay } from "@/lib/mock-delay";
import { mockCategories } from "@/mocks/categories";
import { getRelatedProducts, mockProducts } from "@/mocks/products";
import { getReviewsByProduct, mockReviews } from "@/mocks/reviews";
import { useAuthStore } from "@/store/authStore";
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

export function toListItem(product: Product): ProductListItem {
  const {
    id, sku, name, slug, price, compareAtPrice, currency, images,
    category, stock, status, rating, reviewCount, isFeatured, isNew,
  } = product;
  return { id, sku, name, slug, price, compareAtPrice, currency, images, category, stock, status, rating, reviewCount, isFeatured, isNew };
}

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Champs qu'un admin/vendeur peut soumettre pour créer un produit (voir createProductSchema). */
export interface ProductInput {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  brandId?: string;
  stock: number;
  weightKg?: number;
  images: string[];
  status: Product["status"];
}

export interface ReviewInput {
  rating: number;
  title: string;
  comment: string;
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

  async createReview(productId: string, input: ReviewInput): Promise<ProductReview> {
    if (env.useMocks) {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Vous devez être connecté pour laisser un avis.");
      if (mockReviews.some((r) => r.productId === productId && r.authorId === user.id)) {
        throw new Error("Vous avez déjà laissé un avis sur ce produit.");
      }
      const review: ProductReview = {
        id: `review-${Date.now()}`,
        productId,
        authorId: user.id,
        authorName: `${user.firstName} ${user.lastName}`,
        authorAvatarUrl: user.avatarUrl,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        createdAt: new Date().toISOString(),
        verifiedPurchase: false,
      };
      mockReviews.unshift(review);
      const product = mockProducts.find((p) => p.id === productId);
      if (product) {
        const productReviews = mockReviews.filter((r) => r.productId === productId);
        product.reviewCount = productReviews.length;
        product.rating = Number(
          (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(2),
        );
      }
      return mockDelay(review, 300);
    }
    const { data } = await httpClient.post<ProductReview>(`/products/${productId}/reviews`, input);
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

  async getById(id: string): Promise<Product | null> {
    if (env.useMocks) {
      return mockDelay(mockProducts.find((p) => p.id === id) ?? null, 200);
    }
    const { data } = await httpClient.get<Product>(`/products/${id}`);
    return data;
  },

  async create(input: ProductInput): Promise<Product> {
    if (env.useMocks) {
      const category = mockCategories.find((c) => c.id === input.categoryId);
      const now = new Date().toISOString();
      const product: Product = {
        id: `product-${Date.now()}`,
        sku: input.sku,
        name: input.name,
        slug: slugifyName(input.name),
        description: input.description,
        shortDescription: input.shortDescription,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        currency: "GNF",
        images: input.images,
        categoryId: input.categoryId,
        category: category ? { id: category.id, name: category.name, slug: category.slug } : { id: "", name: "", slug: "" },
        stock: input.stock,
        weightKg: input.weightKg,
        status: input.status,
        rating: 0,
        reviewCount: 0,
        tags: [],
        isFeatured: false,
        isNew: true,
        createdAt: now,
        updatedAt: now,
      };
      mockProducts.unshift(product);
      return mockDelay(product, 400);
    }
    const { data } = await httpClient.post<Product>("/products", input);
    return data;
  },

  /** Le SKU n'est jamais modifiable après création (voir updateProductSchema côté backend, qui n'accepte pas ce champ). */
  async update(id: string, changes: Partial<Omit<ProductInput, "sku">>): Promise<Product> {
    if (env.useMocks) {
      const product = mockProducts.find((p) => p.id === id);
      if (!product) throw new Error("Produit introuvable.");
      const { categoryId, ...rest } = changes;
      Object.assign(product, rest);
      if (categoryId) {
        const category = mockCategories.find((c) => c.id === categoryId);
        product.categoryId = categoryId;
        if (category) product.category = { id: category.id, name: category.name, slug: category.slug };
      }
      product.updatedAt = new Date().toISOString();
      return mockDelay(product, 400);
    }
    const { data } = await httpClient.patch<Product>(`/products/${id}`, changes);
    return data;
  },

  async remove(id: string): Promise<void> {
    if (env.useMocks) {
      const index = mockProducts.findIndex((p) => p.id === id);
      if (index >= 0) mockProducts.splice(index, 1);
      await mockDelay(undefined, 300);
      return;
    }
    await httpClient.delete(`/products/${id}`);
  },
};

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
}

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

  async create(input: CategoryInput): Promise<Category> {
    if (env.useMocks) {
      const category: Category = {
        id: `cat-${Date.now()}`,
        name: input.name,
        slug: input.slug || slugifyName(input.name),
        description: input.description,
        parentId: input.parentId ?? null,
        productCount: 0,
      };
      mockCategories.push(category);
      return mockDelay(category, 300);
    }
    const { data } = await httpClient.post<Category>("/categories", input);
    return data;
  },

  async update(id: string, changes: Partial<CategoryInput>): Promise<Category> {
    if (env.useMocks) {
      const category = mockCategories.find((c) => c.id === id);
      if (!category) throw new Error("Catégorie introuvable.");
      Object.assign(category, changes);
      return mockDelay(category, 300);
    }
    const { data } = await httpClient.patch<Category>(`/categories/${id}`, changes);
    return data;
  },

  async remove(id: string): Promise<void> {
    if (env.useMocks) {
      const index = mockCategories.findIndex((c) => c.id === id);
      if (index >= 0) mockCategories.splice(index, 1);
      await mockDelay(undefined, 250);
      return;
    }
    await httpClient.delete(`/categories/${id}`);
  },
};
