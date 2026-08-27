import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductSortOption } from "@/types/product.types";

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: "relevance", label: "Pertinence" },
  { value: "popularity", label: "Popularité" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "newest", label: "Nouveautés" },
];

interface ProductSortSelectProps {
  value: ProductSortOption;
  onChange: (value: ProductSortOption) => void;
}

export function ProductSortSelect({ value, onChange }: ProductSortSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ProductSortOption)}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Trier par" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
