import { ChevronDownIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCategoriesQuery } from "@/features/categories/api/useCategoriesQuery";
import { ROUTES } from "@/constants/routes.constants";

export function CategoriesMenu() {
  const { data: categories, isLoading } = useCategoriesQuery();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-accent-foreground">
        Catégories
        <ChevronDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {isLoading && <DropdownMenuItem disabled>Chargement…</DropdownMenuItem>}
        {categories?.map((category) => (
          <DropdownMenuItem key={category.id} asChild>
            <Link to={`${ROUTES.shop}?category=${category.slug}`}>{category.name}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
