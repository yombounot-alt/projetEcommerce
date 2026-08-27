import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCategoriesQuery } from "@/features/categories/api/useCategoriesQuery";
import { ROUTES } from "@/constants/routes.constants";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { label: "Accueil", to: ROUTES.home },
  { label: "Boutique", to: ROUTES.shop },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { data: categories } = useCategoriesQuery();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle asChild>
            <Logo />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Separator />

        <div className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Catégories
          </p>
          {categories?.map((category) => (
            <Link
              key={category.id}
              to={`${ROUTES.shop}?category=${category.slug}`}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
