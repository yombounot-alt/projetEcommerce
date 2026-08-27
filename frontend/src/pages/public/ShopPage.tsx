import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PaginationControl } from "@/components/common/PaginationControl";
import { SearchBar } from "@/components/common/SearchBar";
import { Seo } from "@/components/common/Seo";
import { ProductFilters } from "@/features/products/components/ProductFilters";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { ProductSortSelect } from "@/features/products/components/ProductSortSelect";
import { useProductsQuery } from "@/features/products/api/useProductsQuery";
import type { ProductFilters as ProductFiltersValue, ProductSortOption } from "@/types/product.types";

function parseFilters(params: URLSearchParams): ProductFiltersValue {
  return {
    search: params.get("search") ?? undefined,
    category: params.get("category") ?? undefined,
    minPrice: params.has("minPrice") ? Number(params.get("minPrice")) : undefined,
    maxPrice: params.has("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    inStockOnly: params.get("inStock") === "true",
    onSaleOnly: params.get("onSale") === "true",
    sort: (params.get("sort") as ProductSortOption | null) ?? "relevance",
    page: params.has("page") ? Number(params.get("page")) : 1,
  };
}

function toSearchParams(filters: ProductFiltersValue): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (typeof filters.minPrice === "number") params.set("minPrice", String(filters.minPrice));
  if (typeof filters.maxPrice === "number") params.set("maxPrice", String(filters.maxPrice));
  if (filters.inStockOnly) params.set("inStock", "true");
  if (filters.onSaleOnly) params.set("onSale", "true");
  if (filters.sort && filters.sort !== "relevance") params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const { data, isLoading } = useProductsQuery(filters);

  function updateFilters(patch: Partial<ProductFiltersValue>, resetPage = true) {
    setSearchParams(toSearchParams({ ...filters, ...patch, page: resetPage ? 1 : filters.page }));
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="container-page py-10">
      <Seo
        title="Boutique"
        description="Parcourez le catalogue Luméra : électronique, mode, maison, beauté et plus encore."
        canonicalPath="/shop"
      />

      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Boutique</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Recherche…" : `${data?.pagination.totalItems ?? 0} produit(s) trouvé(s)`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <ProductFilters filters={filters} onChange={updateFilters} onReset={resetFilters} />

        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchBar
              value={filters.search ?? ""}
              onChange={(value) => updateFilters({ search: value || undefined })}
              placeholder="Rechercher un produit…"
              className="sm:max-w-xs"
            />
            <ProductSortSelect
              value={filters.sort ?? "relevance"}
              onChange={(sort) => updateFilters({ sort }, false)}
            />
          </div>

          <ProductGrid products={data?.items ?? []} isLoading={isLoading} />

          {data && (
            <PaginationControl
              pagination={data.pagination}
              onPageChange={(page) => updateFilters({ page }, false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
