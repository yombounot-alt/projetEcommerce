import { HeartIcon, ShoppingBagIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchBar } from "@/components/common/SearchBar";
import { ROUTES } from "@/constants/routes.constants";
import { selectCartCount, useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { CategoriesMenu } from "./CategoriesMenu";
import { IconLinkButton } from "./IconLinkButton";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";

const NAV_LINKS = [
  { label: "Accueil", to: ROUTES.home },
  { label: "Boutique", to: ROUTES.shop },
];

export function Navbar() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const cartCount = useCartStore(selectCartCount);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  function handleSearch(value: string) {
    setSearch(value);
    if (value.trim()) {
      navigate(`${ROUTES.shop}?search=${encodeURIComponent(value.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-page flex h-16 items-center gap-4">
        <MobileNav />
        <Logo className="shrink-0" />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <CategoriesMenu />
        </nav>

        <div className="ml-auto hidden max-w-sm flex-1 md:block">
          <SearchBar value={search} onChange={handleSearch} placeholder="Rechercher un produit…" />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <IconLinkButton to={ROUTES.wishlist} icon={HeartIcon} label="Favoris" count={wishlistCount} />
          <IconLinkButton to={ROUTES.cart} icon={ShoppingBagIcon} label="Panier" count={cartCount} />
          <UserMenu />
        </div>
      </div>

      <div className="container-page pb-3 md:hidden">
        <SearchBar value={search} onChange={handleSearch} placeholder="Rechercher un produit…" />
      </div>
    </header>
  );
}
