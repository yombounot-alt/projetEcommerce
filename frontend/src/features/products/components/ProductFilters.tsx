import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCategoriesQuery } from "@/features/categories/api/useCategoriesQuery";
import type { ProductFilters as ProductFiltersValue } from "@/types/product.types";

interface ProductFiltersProps {
  filters: ProductFiltersValue;
  onChange: (patch: Partial<ProductFiltersValue>) => void;
  onReset: () => void;
}

export function ProductFilters({ filters, onChange, onReset }: ProductFiltersProps) {
  const { data: categories, isLoading } = useCategoriesQuery();
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "");

  function applyPriceRange() {
    onChange({
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  }

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-heading text-base font-semibold text-foreground">Filtres</p>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Réinitialiser
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Catégories</p>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={!filters.category}
              onCheckedChange={() => onChange({ category: undefined })}
            />
            Toutes les catégories
          </label>
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {categories?.map((category) => (
            <label key={category.id} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={filters.category === category.slug}
                onCheckedChange={(checked) => onChange({ category: checked ? category.slug : undefined })}
              />
              {category.name}
              <span className="ml-auto text-xs">({category.productCount})</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Prix</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="min-price" className="text-xs text-muted-foreground">Min</Label>
            <Input
              id="min-price"
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={applyPriceRange}
              placeholder="0"
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="max-price" className="text-xs text-muted-foreground">Max</Label>
            <Input
              id="max-price"
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={applyPriceRange}
              placeholder="1000"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={!!filters.inStockOnly}
            onCheckedChange={(checked) => onChange({ inStockOnly: checked === true })}
          />
          En stock uniquement
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={!!filters.onSaleOnly}
            onCheckedChange={(checked) => onChange({ onSaleOnly: checked === true })}
          />
          Produits en promotion
        </label>
      </div>
    </aside>
  );
}
